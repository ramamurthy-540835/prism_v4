import asyncio
import os
import platform
import logging
import pickle
import lzma
import re
import uuid
import zipfile
import tempfile
import subprocess
import psutil
import gc
import json
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from pathlib import Path
from typing import Final, Optional, Dict, List
import streamlit as st
import pyperclip
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from llama_cpp import Llama
from langgraph.graph import StateGraph, END

# Logging Setup with Enhanced Monitoring
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("chatbot.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Path Configuration
class AppPaths:
    if platform.system() == "Windows":
        _BASE_DIR = Path(r"C:\Users\VRamamurthy\code\data_mapping_v19")
        MODELS_DIR: Final[Path] = Path(r"C:\Users\VRamamurthy\OneDrive - Mastech Digital\GenAI-Developers\modelslist")
        MODEL_CACHE_DIR: Final[Path] = Path(r"C:\Users\VRamamurthy\OneDrive - Mastech Digital\GenAI-Developers\model_cache")
    else:
        _BASE_DIR = Path("/home/appadmin/code/codegen")
        MODELS_DIR: Final[Path] = Path("/home/appadmin/code/modelslist")
        MODEL_CACHE_DIR: Final[Path] = Path("/home/appadmin/code/model_cache")

    TEMP_DIR: Final[Path] = _BASE_DIR / "temp"
    CHAT_CACHE_DIR: Final[Path] = TEMP_DIR / "chat_cache"

    @classmethod
    def validate_paths(cls):
        for path in [cls.TEMP_DIR, cls.MODELS_DIR, cls.MODEL_CACHE_DIR, cls.CHAT_CACHE_DIR]:
            path.mkdir(parents=True, exist_ok=True)

AppPaths.validate_paths()

# Optimized Configuration Constants
BATCH_SIZE = 4096
MAX_CONCURRENT = min(os.cpu_count() or 4, 4)
MAX_GPU_LAYERS = 50
MODEL_CONTEXT_SIZE = 16384
MAX_PROMPT_LENGTH = 15872
MAX_TOKENS_RESPONSE = 1200
MAX_TOKENS_DETECTION = 10
MAX_TOKENS_CONVERSION = 2000
TEMPERATURE_DETECTION = 0.0
TEMPERATURE_RESPONSE = 0.65
TEMPERATURE_CONVERSION = 0.3
MAX_CODE_LENGTH = 50000
LLM_TIMEOUT = 1200

# Dynamic GPU Layer Adjustment
def get_gpu_memory():
    try:
        output = subprocess.check_output(["nvidia-smi", "--query-gpu=memory.total", "--format=csv"]).decode()
        total_memory = int(re.search(r"(\d+)\s*MiB", output).group(1))
        return total_memory
    except Exception:
        logger.warning("Failed to query GPU memory, checking environment variable")
        return int(os.getenv("GPU_MEMORY_MB", 16384))

gpu_memory = get_gpu_memory()
MAX_GPU_LAYERS = 60 if gpu_memory > 16384 else 50
logger.info(f"Set MAX_GPU_LAYERS to {MAX_GPU_LAYERS} based on {gpu_memory} MiB VRAM")

# Text Splitter Optimized for Code
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=4096,
    chunk_overlap=512,
    separators=["\n\nclass ", "\n\ndef ", "\n\nasync ", "\n\n#", "\n\n//", "\n\n/*", "\n\n--", "\n\n"]
)

# Emergency Splitter for Timeout Recovery
emergency_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1024,
    chunk_overlap=128
)

# Thread Pool
executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT, thread_name_prefix="CodeGenWorker")

# Periodic Cleanup Task
async def periodic_cleanup():
    while True:
        await asyncio.sleep(300)
        gc.collect()
        logger.info("Performed GC cleanup")

# Memory Safety Decorator
def memory_safe(func):
    async def wrapper(*args, **kwargs):
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        if mem.percent > 90:
            logger.error(f"Memory critical: {mem.percent}% used")
            st.error("System memory is too high. Please free up resources and try again.")
            return None
        if swap.percent > 50:
            logger.warning(f"High swap usage: {swap.percent}%")
        start_time = asyncio.get_event_loop().time()
        result = await func(*args, **kwargs)
        elapsed = asyncio.get_event_loop().time() - start_time
        logger.info(f"Function {func.__name__} completed in {elapsed:.2f} seconds")
        return result
    return wrapper

# Prompt Templates
LANGUAGE_DETECTION_TEMPLATE = """
[STRICT FORMAT] Identify the programming language from this code.
Options: Python, PySpark, Spark SQL, BigQuery SQL, Snowflake SQL, Databricks SQL, PostgreSQL, MySQL, 
Oracle SQL, T-SQL, Standard SQL, Scala, R, Julia, JavaScript, TypeScript, Shell, PowerShell, YAML, JSON, XML

Return ONLY the language name in format: [Language: XXXX]

Code:
{code}
"""
LANGUAGE_DETECTION_PROMPT = PromptTemplate(input_variables=["code"], template=LANGUAGE_DETECTION_TEMPLATE)

CHAT_TEMPLATE = """
You are an expert data engineer specializing in code optimization and conversion. Provide a clear, concise, and high-quality response to the following query. If code is involved, ensure it is well-formatted and includes brief, relevant examples where applicable. Maintain a professional tone.

Query: {query}
Response:
"""
CHAT_PROMPT = PromptTemplate(input_variables=["query"], template=CHAT_TEMPLATE)

QUESTION_TEMPLATE = """
You are an expert data engineer. Answer the following question about code, focusing on requirements, bug fixes, or best practices. If code is provided, analyze it and provide specific suggestions. Return a markdown response with clear explanations and examples.

### Question:
{question}

### Code (if provided):
{code}

### Answer:
"""
QUESTION_PROMPT = PromptTemplate(input_variables=["question", "code"], template=QUESTION_TEMPLATE)

USE_CASE_CODE_TEMPLATE_COT = """
You are an expert data engineer. Generate {target_lang} code for the following use case description using a chain-of-thought approach with few-shot examples. Return a markdown response with sections for Reasoning and Final Code.

### Few-Shot Examples:
[Use Case]: Aggregate sales data by region.
[Output for PySpark]:
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import sum

spark = SparkSession.builder.appName("SalesAggregation").getOrCreate()
df = spark.read.format("csv").option("header", "true").load("sales.csv")
result = df.groupBy("region").agg(sum("sales").alias("total_sales"))
result.show()
```

[Use Case]: Find top 10 stocks in Mumbai.
[Output for BigQuery SQL]:
```sql
SELECT company_name, share_value, trade_volume
FROM `your-project-id.your-dataset.stock_data`
WHERE city = 'Mumbai'
ORDER BY share_value DESC
LIMIT 10;
```

### Use Case Description:
{description}

### Reasoning:
1. Understand the use case and identify key components (e.g., data source, operations).
2. Map components to idiomatic {target_lang} constructs.
3. Include error handling and optimize for performance.

### Final Code:
"""
USE_CASE_CODE_PROMPT_COT = PromptTemplate(input_variables=["description", "target_lang"], template=USE_CASE_CODE_TEMPLATE_COT)

USE_CASE_CODE_TEMPLATE_NO_COT = """
You are an expert data engineer. Generate {target_lang} code for the following use case description. Return only the code block, no reasoning or markdown.

### Use Case Description:
{description}

### Code:
"""
USE_CASE_CODE_PROMPT_NO_COT = PromptTemplate(input_variables=["description", "target_lang"], template=USE_CASE_CODE_TEMPLATE_NO_COT)

CODE_CONVERSION_TEMPLATE = """
You are a highly skilled code conversion assistant.

Your task is to convert the given {source_lang} code into correct, idiomatic, and optimized {target_lang} code.

⚠️ Strict Rules:
- Return only valid, executable {target_lang} code.
- Do NOT include explanations, comments, markdown, or any headers.
- Preserve all logic, structure, and variable naming.
- Handle syntax differences, edge cases, and data handling quirks appropriately.

### Input ({source_lang}):
{code}

### Output ({target_lang}):
"""
CODE_CONVERSION_PROMPT = PromptTemplate(input_variables=["code", "source_lang", "target_lang"], template=CODE_CONVERSION_TEMPLATE)

CODE_FIX_TEMPLATE = """
You are an expert code fixer. Analyze the following {lang} code for syntax errors, logical issues, or inefficiencies. Provide the corrected code with minimal changes to preserve the original intent. Return only the fixed code, no explanations or comments.

### Input ({lang}):
{code}

### Fixed ({lang}):
"""
CODE_FIX_PROMPT = PromptTemplate(input_variables=["code", "lang"], template=CODE_FIX_TEMPLATE)

CODE_DEBUG_TEMPLATE = """
You are an expert debugger. Analyze the following {lang} code and identify potential bugs, runtime errors, or performance issues. {best_practices} Return a markdown-formatted response with sections for Issues, Suggested Fixes, and Best Practices (if requested). For Python code, include line-by-line analysis where applicable.

### Input ({lang}):
{code}

### Debug Analysis:
"""
CODE_DEBUG_PROMPT = PromptTemplate(input_variables=["code", "lang", "best_practices"], template=CODE_DEBUG_TEMPLATE)

# Enterprise Conversion Templates
ENTERPRISE_CONVERSION_TEMPLATES = {
    "hive_to_bigquery": {
        "cot_prompt": """Convert HiveQL to BigQuery SQL using this process:
1. Identify partitioning scheme differences
2. Convert Hive-specific functions to BQ equivalents
3. Handle EXPLODE/UNNEST patterns
4. Adjust date/time functions
5. Validate schema compatibility

Examples:
[Input Hive]
SELECT DAY(dt) AS day, COUNT(*) 
FROM logs 
LATERAL VIEW EXPLODE(events) tmp AS event 
WHERE dt BETWEEN '20230101' AND '20230107'

[Output BigQuery]
SELECT EXTRACT(DAY FROM _PARTITIONTIME) AS day, COUNT(*) 
FROM logs, UNNEST(events) AS event 
WHERE _PARTITIONTIME BETWEEN '2023-01-01' AND '2023-01-07'

[Input Hive]
{code}

Step-by-Step Conversion:""",
        "final_prompt": "Generate final BigQuery SQL:",
        "validation_rules": [
            ("LATERAL VIEW EXPLODE", "UNNEST"),
            ("dt BETWEEN", "_PARTITIONTIME BETWEEN")
        ]
    },
    "general": {
        "cot_prompt": """Convert {source_lang} code to {target_lang} code using this process:
1. Identify key language constructs and syntax differences
2. Map {source_lang} functions and patterns to {target_lang} equivalents
3. Preserve logic, variable names, and structure
4. Handle edge cases and optimize for performance
5. Validate compatibility with {target_lang} best practices

Examples:
[Input Python]
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

[Output PySpark]
from pyspark.sql import SparkSession
from pyspark.sql.functions import sum

def calculate_sum(numbers_df):
    spark = SparkSession.builder.appName("SumCalculation").getOrCreate()
    return numbers_df.agg(sum("value").alias("total")).collect()[0]["total"]

[Input {source_lang}]
{code}

Step-by-Step Conversion:""",
        "final_prompt": "Generate final {target_lang} code:",
        "validation_rules": []
    }
}

# Conversion State for LangGraph
class ConversionState:
    def __init__(self, code: str, source_lang: str, target_lang: str, conversion_type: str):
        self.code = code
        self.source_lang = source_lang
        self.target_lang = target_lang
        self.conversion_type = conversion_type
        self.analysis = None
        self.converted_code = None
        self.validation = None
        self.iteration = 0
        self.history = []

# Enterprise Converter with LangGraph
class EnterpriseConverter:
    def __init__(self, model_manager):
        self.model_manager = model_manager
        self.workflow = self.create_conversion_workflow()

    def create_conversion_workflow(self):
        workflow = StateGraph(ConversionState)
        workflow.add_node("detect_language", self.detect_language)
        workflow.add_node("analyze_code", self.analyze_code)
        workflow.add_node("convert_code", self.convert_code)
        workflow.add_node("validate_code", self.validate_code)
        workflow.add_node("finalize", self.finalize_conversion)
        workflow.set_entry_point("detect_language")
        workflow.add_edge("detect_language", "analyze_code")
        workflow.add_edge("analyze_code", "convert_code")
        workflow.add_edge("convert_code", "validate_code")
        workflow.add_conditional_edges(
            "validate_code",
            self.decide_to_retry,
            {"retry": "convert_code", "done": "finalize"}
        )
        workflow.add_edge("finalize", END)
        return workflow.compile()

    async def detect_language(self, state: ConversionState) -> ConversionState:
        if not state.source_lang or state.source_lang.lower() == "auto":
            model = await self.model_manager.get_model(st.session_state.loaded_model_id)
            if model:
                lang = await detect_language_with_llm_async(state.code, model)
                state.source_lang = lang.value
            else:
                state.source_lang = "Unknown"
        return state

    async def analyze_code(self, state: ConversionState) -> ConversionState:
        template = ENTERPRISE_CONVERSION_TEMPLATES.get(state.conversion_type, {})
        if template.get("cot_prompt"):
            cot_prompt = template["cot_prompt"].format(
                code=state.code[:MAX_PROMPT_LENGTH],
                source_lang=state.source_lang,
                target_lang=state.target_lang
            )
            state.analysis = await self.generate_response(
                cot_prompt,
                st.session_state.loaded_model_id,
                MAX_TOKENS_CONVERSION,
                0.3,
                0.9
            )
        return state

    async def convert_code(self, state: ConversionState) -> ConversionState:
        template = ENTERPRISE_CONVERSION_TEMPLATES.get(state.conversion_type, {})
        final_prompt = template.get("final_prompt", CODE_CONVERSION_PROMPT.format(
            code=state.code[:MAX_PROMPT_LENGTH],
            source_lang=state.source_lang,
            target_lang=state.target_lang
        ))
        if state.analysis:
            prompt = f"{state.analysis}\n\n{final_prompt}"
        else:
            prompt = final_prompt
        try:
            state.converted_code = await self.generate_response(
                prompt,
                st.session_state.loaded_model_id,
                MAX_TOKENS_CONVERSION,
                0.1,
                0.9
            )
        except asyncio.TimeoutError:
            logger.warning("Conversion timeout, reducing chunk size")
            state.code = text_splitter.split_text(state.code)[0]
            return await self.convert_code(state)
        state.iteration += 1
        return state

    async def validate_code(self, state: ConversionState) -> ConversionState:
        state.validation = self.validate_converted_code(
            state.converted_code,
            state.target_lang,
            state.conversion_type
        )
        state.history.append({
            "iteration": state.iteration,
            "code": state.converted_code,
            "validation": state.validation
        })
        return state

    def decide_to_retry(self, state: ConversionState) -> str:
        if "❌" in state.validation and state.iteration < 3:
            return "retry"
        return "done"

    async def finalize_conversion(self, state: ConversionState) -> ConversionState:
        if state.target_lang.lower() == "pyspark" and "from pyspark.sql import SparkSession" not in state.converted_code:
            state.converted_code = f"from pyspark.sql import SparkSession\n\n{state.converted_code}"
        return state

    async def generate_response(self, prompt: str, model_name: str, max_tokens: int, temp: float, top_p: float) -> str:
        model = await self.model_manager.get_model(model_name)
        if not model:
            return f"Error: Model {model_name} not loaded"
        chunks = text_splitter.split_text(prompt[:MAX_PROMPT_LENGTH])
        responses = []
        timeout = min(LLM_TIMEOUT, 300 + len(prompt) // 100)
        for chunk in chunks:
            messages = [{"role": "system", "content": "You are a data engineering expert."}, {"role": "user", "content": chunk}]
            try:
                active_tasks = sum(1 for _ in executor._threads)
                if active_tasks >= MAX_CONCURRENT:
                    await asyncio.sleep(1)
                response = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        executor,
                        lambda: model.create_chat_completion(messages=messages, max_tokens=max_tokens, temperature=temp, top_p=top_p)["choices"][0]["message"]["content"].strip()
                    ),
                    timeout=timeout
                )
                responses.append(response)
            except asyncio.TimeoutError:
                logger.error(f"LLM timeout for chunk: {chunk[:100]}...")
                responses.append("Error: LLM output timed out")
        return "\n".join(responses)

    def validate_converted_code(self, converted_code: str, target_lang: str, conversion_type: str) -> str:
        validation = []
        target_lang = target_lang.lower()
        if target_lang == "bigquery sql" and "UNNEST" not in converted_code and "EXPLODE" in converted_code:
            validation.append("⚠️ Potential missing UNNEST; EXPLODE detected")
        if target_lang == "python" and "import" not in converted_code:
            validation.append("⚠️ No imports detected for required libraries")
        if conversion_type and conversion_type in ENTERPRISE_CONVERSION_TEMPLATES:
            for pattern, replacement in ENTERPRISE_CONVERSION_TEMPLATES[conversion_type].get("validation_rules", []):
                if re.search(pattern, converted_code, re.IGNORECASE):
                    validation.append(f"❌ Found '{pattern}' - expected conversion to '{replacement}'")
        return "\n".join(validation) if validation else "✅ Validation passed"

# Model Configuration with Dynamic Discovery
def discover_models():
    model_map = {}
    for model_dir in AppPaths.MODELS_DIR.iterdir():
        if model_dir.is_dir():
            gguf_files = list(model_dir.glob("*.gguf"))
            if gguf_files:
                model_name = model_dir.name.replace("_", "-")
                model_map[model_name] = gguf_files[0]
                if len(gguf_files) > 1:
                    logger.warning(f"Multiple GGUF files in {model_dir}, using {model_map[model_name]}")
    return model_map

MODELS = discover_models()

# Session State Initialization
if "messages" not in st.session_state:
    st.session_state.messages = []
if "llm_model" not in st.session_state:
    st.session_state.llm_model = None
if "loaded_model_id" not in st.session_state:
    st.session_state.loaded_model_id = None
if "device" not in st.session_state:
    st.session_state.device = "cuda" if 'cuda' in platform.platform().lower() else "cpu"
if "code_files" not in st.session_state:
    st.session_state.code_files = []
if "use_case_target_lang" not in st.session_state:
    st.session_state.use_case_target_lang = "Python"
if "questions" not in st.session_state:
    st.session_state.questions = []

# Language Enum
class Language(Enum):
    PYTHON = "Python"
    PYSPARK = "PySpark"
    SPARK_SQL = "Spark SQL"
    SQL = "Standard SQL"
    BIGQUERY = "BigQuery SQL"
    SNOWFLAKE = "Snowflake SQL"
    DATABRICKS = "Databricks SQL"
    POSTGRESQL = "PostgreSQL"
    MYSQL = "MySQL"
    ORACLE = "Oracle SQL"
    TSQL = "T-SQL"
    SCALA = "Scala"
    R = "R"
    JULIA = "Julia"
    JAVASCRIPT = "JavaScript"
    TYPESCRIPT = "TypeScript"
    SHELL = "Shell"
    POWER_SHELL = "PowerShell"
    YAML = "YAML"
    JSON = "JSON"
    XML = "XML"
    UNKNOWN = "Unknown"

# Model Manager
class ModelManager:
    _instance = None
    _model_checks = {}

    def __new__(cls):
        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance.models = {}
        return cls._instance

    async def get_model(self, model_name: str) -> Optional[Llama]:
        if model_name in self.models:
            return self.models[model_name]
        if not self._validate_model(model_name):
            return None
        cache_path = AppPaths.MODEL_CACHE_DIR / f"{model_name}.cache"
        if await self._try_load_cache(model_name, cache_path):
            return self.models[model_name]
        return await self._load_fresh_model(model_name, cache_path)

    def _validate_model(self, model_name: str) -> bool:
        if model_name in self._model_checks:
            return self._model_checks[model_name]
        model_path = MODELS.get(model_name)
        valid = True
        if not model_path:
            logger.error(f"Model {model_name} not in configuration")
            valid = False
        elif not model_path.exists():
            logger.error(f"Model file missing: {model_path}")
            valid = False
        self._model_checks[model_name] = valid
        return valid

    async def _try_load_cache(self, model_name: str, cache_path: Path) -> bool:
        if not cache_path.exists():
            return False
        try:
            model = await asyncio.get_event_loop().run_in_executor(
                executor,
                self._load_cache_file,
                cache_path
            )
            if model.model_path != str(MODELS[model_name]):
                logger.warning(f"Cache mismatch for {model_name}, reloading")
                return False
            self.models[model_name] = model
            st.session_state.llm_model = model
            st.session_state.loaded_model_id = model_name
            logger.info(f"Loaded {model_name} from validated cache")
            await self._warmup_model(model)
            return True
        except Exception as e:
            logger.error(f"Cache load failed for {model_name}: {e}")
            return False

    def _load_cache_file(self, cache_path: Path):
        with lzma.open(cache_path, 'rb') as f:
            model = pickle.load(f)
        if not hasattr(model, 'model_path'):
            raise ValueError("Invalid cache format")
        return model

    async def _load_fresh_model(self, model_name: str, cache_path: Path) -> Optional[Llama]:
        for attempt in range(3):
            try:
                model_path = MODELS[model_name]
                n_gpu_layers = MAX_GPU_LAYERS if st.session_state.device == "cuda" else 0
                model = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: Llama(
                        model_path=str(model_path),
                        n_ctx=MODEL_CONTEXT_SIZE,
                        n_threads=MAX_CONCURRENT,
                        n_gpu_layers=n_gpu_layers,
                        n_batch=BATCH_SIZE,
                        verbose=False
                    )
                )
                await self._save_model_cache(model, model_name, cache_path)
                self.models[model_name] = model
                st.session_state.llm_model = model
                st.session_state.loaded_model_id = model_name
                logger.info(f"Successfully loaded and cached {model_name}")
                await self._warmup_model(model)
                return model
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed to load {model_name}: {e}")
                if attempt == 2:
                    self._model_checks[model_name] = False
                    st.error(f"Failed to load model {model_name} after 3 attempts: {e}")
                    return None
                await asyncio.sleep(1)

    async def _save_model_cache(self, model: Llama, model_name: str, cache_path: Path):
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            await asyncio.get_event_loop().run_in_executor(
                executor,
                self._serialize_model,
                model, cache_path
            )
            logger.info(f"Updated cache for {model_name}")
        except Exception as e:
            logger.error(f"Failed to save {model_name} cache: {e}")

    def _serialize_model(self, model: Llama, cache_path: Path):
        with lzma.open(cache_path, 'wb') as f:
            pickle.dump(model, f, protocol=4)

    async def _warmup_model(self, model: Llama):
        try:
            await asyncio.get_event_loop().run_in_executor(
                executor,
                lambda: model.create_chat_completion(
                    messages=[{"role": "user", "content": "1+1="}],
                    max_tokens=2
                )
            )
        except Exception as e:
            logger.warning(f"Model warmup failed: {e}")

# Language Detection with Robust Parsing
async def detect_language_with_llm_async(code: str, model: Llama) -> Language:
    if not model:
        return Language.UNKNOWN
    prompt = LANGUAGE_DETECTION_PROMPT.format(code=code[:MAX_PROMPT_LENGTH])
    messages = [{"role": "system", "content": "Return only the language name in specified format."}, {"role": "user", "content": prompt}]
    try:
        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                executor,
                lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_DETECTION, temperature=TEMPERATURE_DETECTION)["choices"][0]["message"]["content"].strip()
            ),
            timeout=LLM_TIMEOUT
        )
        match = re.search(r"\[Language:\s*(.+?)\]", response, re.IGNORECASE)
        if match:
            lang = match.group(1).strip()
            return Language[lang.replace(" ", "_").upper()]
        first_line = response.split("\n")[0].strip(" .")
        if first_line.upper() in [lang.name for lang in Language]:
            return Language[first_line.replace(" ", "_").upper()]
        return await fallback_detection(code)
    except (KeyError, asyncio.TimeoutError, ValueError, json.JSONDecodeError) as e:
        logger.error(f"Language detection failed: {e}")
        return await fallback_detection(code)

async def fallback_detection(code: str) -> Language:
    ext_patterns = {
        r"\.py$": Language.PYTHON,
        r"\.sql$": Language.SQL,
        r"\.scala$": Language.SCALA,
        r"\.js$": Language.JAVASCRIPT,
        r"\.ts$": Language.TYPESCRIPT,
        r"\.sh$": Language.SHELL,
        r"\.ps1$": Language.POWER_SHELL,
        r"\.yaml$|\.yml$": Language.YAML,
        r"\.json$": Language.JSON,
        r"\.xml$": Language.XML
    }
    for pattern, lang in ext_patterns.items():
        if re.search(pattern, code, re.IGNORECASE):
            return lang
    return Language.UNKNOWN

# Code Fixing with Timeout Recovery
async def fix_code_async(code: str, lang: str, model_name: str) -> Dict[str, str]:
    model = await ModelManager().get_model(model_name)
    if not model:
        return {"error": f"Model {model_name} not loaded", "code": code}
    try:
        chunks = text_splitter.split_text(code[:MAX_CODE_LENGTH]) if len(code) > MAX_PROMPT_LENGTH else [code]
        fixed_chunks = []
        for chunk in chunks:
            prompt = CODE_FIX_PROMPT.format(code=chunk, lang=lang)
            messages = [{"role": "system", "content": "Fix the code."}, {"role": "user", "content": prompt}]
            try:
                fixed_chunk = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        executor,
                        lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_CONVERSION, temperature=TEMPERATURE_CONVERSION)["choices"][0]["message"]["content"].strip()
                    ),
                    timeout=LLM_TIMEOUT
                )
                fixed_chunks.append(fixed_chunk)
            except asyncio.TimeoutError:
                logger.warning(f"Fixing timeout, using emergency chunking")
                fixed_chunks.append((await process_with_emergency_split(chunk, lang, model_name))["code"])
        fixed_code = "\n".join(fixed_chunks)
        validation_msg = EnterpriseConverter(ModelManager()).validate_converted_code(fixed_code, lang, None)
        return {
            "code": fixed_code,
            "validation": validation_msg
        }
    except Exception as e:
        logger.error(f"Fixing failed: {e}")
        return {"error": str(e), "code": code}

async def process_with_emergency_split(code: str, lang: str, model_name: str) -> Dict[str, str]:
    model = await ModelManager().get_model(model_name)
    if not model:
        return {"error": f"Model {model_name} not loaded", "code": code}
    chunks = emergency_splitter.split_text(code)
    fixed_chunks = []
    for chunk in chunks:
        prompt = CODE_FIX_PROMPT.format(code=chunk, lang=lang)
        messages = [{"role": "system", "content": "Fix the code."}, {"role": "user", "content": prompt}]
        try:
            fixed_chunk = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_CONVERSION, temperature=TEMPERATURE_CONVERSION)["choices"][0]["message"]["content"].strip()
                ),
                timeout=LLM_TIMEOUT
            )
            fixed_chunks.append(fixed_chunk)
        except asyncio.TimeoutError:
            logger.error(f"Emergency fixing timed out for chunk: {chunk[:100]}...")
            fixed_chunks.append(chunk)
    fixed_code = "\n".join(fixed_chunks)
    return {"code": fixed_code, "validation": "Emergency split applied"}

# Code Debugging
async def debug_code_async(code: str, lang: str, model_name: str, include_best_practices: bool) -> str:
    model = await ModelManager().get_model(model_name)
    if not model:
        return f"Error: Model {model_name} not loaded"
    best_practices = "Include a Best Practices section with suggestions for improving code readability, performance, and maintainability." if include_best_practices else ""
    chunks = text_splitter.split_text(code[:MAX_CODE_LENGTH]) if len(code) > MAX_PROMPT_LENGTH else [code]
    debug_analyses = []
    for idx, chunk in enumerate(chunks):
        prompt = CODE_DEBUG_PROMPT.format(code=chunk, lang=lang, best_practices=best_practices)
        messages = [{"role": "system", "content": "Debug the code."}, {"role": "user", "content": prompt}]
        try:
            debug_analysis = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_RESPONSE, temperature=TEMPERATURE_RESPONSE)["choices"][0]["message"]["content"].strip()
                ),
                timeout=LLM_TIMEOUT
            )
            debug_analyses.append(f"### Chunk {idx + 1}\n{debug_analysis}")
        except asyncio.TimeoutError:
            logger.error(f"Debugging timed out for chunk: {chunk[:100]}...")
            debug_analyses.append(f"### Chunk {idx + 1}\nError: Debugging timed out")
    return "\n\n".join(debug_analyses)

# Process Question
async def process_question(question: str, code: str, model_name: str) -> str:
    model = await ModelManager().get_model(model_name)
    if not model:
        return f"Error: Model {model_name} not loaded"
    chunks = text_splitter.split_text(code[:MAX_CODE_LENGTH]) if len(code) > MAX_PROMPT_LENGTH else [code]
    answers = []
    for chunk in chunks:
        prompt = QUESTION_PROMPT.format(question=question, code=chunk)
        messages = [{"role": "system", "content": "Answer the question about the code."}, {"role": "user", "content": prompt}]
        try:
            answer = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_RESPONSE, temperature=TEMPERATURE_RESPONSE)["choices"][0]["message"]["content"].strip()
                ),
                timeout=LLM_TIMEOUT
            )
            answers.append(answer)
        except asyncio.TimeoutError:
            logger.error(f"Question processing timed out for chunk: {chunk[:100]}...")
            answers.append("Error: Question processing timed out")
    combined_answer = "\n\n".join(answers)
    logger.info(f"Question: {question}\nAnswer: {combined_answer}")
    return combined_answer

# ZIP Export
def export_zip(code_files: List[Dict[str, str]]) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_zip:
        with zipfile.ZipFile(temp_zip.name, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file in code_files:
                content = None
                if 'code' in file:
                    content = file['code']
                elif 'converted_code' in file:
                    content = file['converted_code']
                elif 'analysis' in file:
                    content = file['analysis']
                elif 'debug_analysis' in file:
                    content = file['debug_analysis']
                elif 'answer' in file:
                    content = file['answer']
                if content:
                    zipf.writestr(f"{file['name']}", content.encode('utf-8'))
        return temp_zip.name

# Process Individual File
async def process_individual_file(file, model_name: str, do_debug: bool, enable_suggestions: bool) -> Dict[str, str]:
    try:
        encodings = ['utf-8', 'latin1']
        code = None
        for encoding in encodings:
            try:
                code = file.read().decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        if code is None:
            raise UnicodeDecodeError("Failed to decode file with available encodings")
        if len(code) > MAX_CODE_LENGTH:
            code = code[:MAX_CODE_LENGTH]
            logger.warning(f"Truncated file {file.name} to {MAX_CODE_LENGTH} characters")
        model = await ModelManager().get_model(model_name)
        detected_lang = await detect_language_with_llm_async(code, model)
        fixed_result = await fix_code_async(code, detected_lang.value, model_name)
        fixed_code = fixed_result.get("code", code)
        validation = fixed_result.get("validation", "")
        debug_analysis = ""
        if do_debug and enable_suggestions:
            debug_analysis = await debug_code_async(code, detected_lang.value, model_name, enable_suggestions)
        return {
            "name": file.name,
            "code": code,
            "detected_lang": detected_lang.value,
            "fixed_code": fixed_code,
            "validation": validation,
            "debug_analysis": debug_analysis
        }
    except UnicodeDecodeError:
        return {
            "name": file.name,
            "error": "File is not a valid text file (e.g., binary or unsupported encoding)"
        }
    except Exception as e:
        logger.error(f"Error processing file {file.name}: {e}")
        return {
            "name": file.name,
            "error": f"Error processing file: {e}"
        }

# Process Pasted Code
async def process_pasted_code(code: str, lang: str, model_name: str, do_debug: bool, enable_suggestions: bool) -> Dict[str, str]:
    try:
        if len(code) > MAX_CODE_LENGTH:
            code = code[:MAX_CODE_LENGTH]
            logger.warning(f"Truncated pasted code to {MAX_CODE_LENGTH} characters")
        model = await ModelManager().get_model(model_name)
        detected_lang = await detect_language_with_llm_async(code, model) if lang == "Auto" else Language[lang.replace(" ", "_").upper()]
        fixed_result = await fix_code_async(code, detected_lang.value, model_name)
        fixed_code = fixed_result.get("code", code)
        validation = fixed_result.get("validation", "")
        debug_analysis = ""
        if do_debug and enable_suggestions:
            debug_analysis = await debug_code_async(code, detected_lang.value, model_name, enable_suggestions)
        return {
            "name": "pasted_code.txt",
            "code": code,
            "detected_lang": detected_lang.value,
            "fixed_code": fixed_code,
            "validation": validation,
            "debug_analysis": debug_analysis
        }
    except Exception as e:
        logger.error(f"Error processing pasted code: {e}")
        return {
            "name": "pasted_code.txt",
            "error": f"Error processing pasted code: {e}"
        }

# Bulk ZIP Operations
async def process_zip_file(uploaded_zip, model_name: str, do_debug: bool, enable_suggestions: bool) -> List[Dict[str, str]]:
    extracted_files = []
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            if psutil.disk_usage(temp_dir).free < 1_000_000_000:
                st.error("Insufficient disk space to process ZIP.")
                return []
            with zipfile.ZipFile(uploaded_zip, 'r') as zip_ref:
                if zip_ref.testzip() is not None:
                    st.error("Corrupted ZIP file detected. Please upload a valid ZIP.")
                    return []
                zip_ref.extractall(temp_dir)
            total_files = sum(1 for _, _, files in os.walk(temp_dir) for f in files if '__MACOSX' not in _)
            progress_bar = st.progress(0)
            processed_files = 0
            for root, _, files in os.walk(temp_dir):
                if '__MACOSX' in root:
                    continue
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    relative_path = os.path.relpath(file_path, temp_dir).replace(os.sep, '/')
                    try:
                        encodings = ['utf-8', 'latin1']
                        code = None
                        for encoding in encodings:
                            try:
                                with open(file_path, 'r', encoding=encoding) as f:
                                    code = f.read()
                                    break
                            except UnicodeDecodeError:
                                continue
                        if code is None:
                            raise UnicodeDecodeError("Failed to decode file with available encodings")
                        if len(code) > MAX_CODE_LENGTH:
                            code = code[:MAX_CODE_LENGTH]
                            logger.warning(f"Truncated file {relative_path} to {MAX_CODE_LENGTH} characters")
                        model = await ModelManager().get_model(model_name)
                        detected_lang = await detect_language_with_llm_async(code, model)
                        fixed_result = await fix_code_async(code, detected_lang.value, model_name)
                        fixed_code = fixed_result.get("code", code)
                        validation = fixed_result.get("validation", "")
                        debug_analysis = ""
                        if do_debug and enable_suggestions:
                            debug_analysis = await debug_code_async(code, detected_lang.value, model_name, enable_suggestions)
                        extracted_files.append({
                            "name": relative_path,
                            "code": code,
                            "detected_lang": detected_lang.value,
                            "fixed_code": fixed_code,
                            "validation": validation,
                            "debug_analysis": debug_analysis
                        })
                    except UnicodeDecodeError:
                        extracted_files.append({
                            "name": relative_path,
                            "error": "File is not a valid text file (e.g., binary or unsupported encoding)"
                        })
                    except PermissionError:
                        extracted_files.append({
                            "name": relative_path,
                            "error": "Permission denied accessing file"
                        })
                    except Exception as e:
                        logger.error(f"Error processing file {relative_path}: {e}")
                        extracted_files.append({
                            "name": relative_path,
                            "error": f"Error processing file: {e}"
                        })
                    processed_files += 1
                    progress_bar.progress(min(processed_files / total_files, 1.0))
            progress_bar.empty()
        except zipfile.BadZipFile:
            st.error("Invalid or corrupted ZIP file. Please ensure the file is a valid ZIP archive.")
            return []
        except Exception as e:
            logger.error(f"Error processing ZIP: {e}")
            st.error(f"Error processing ZIP: {e}")
            return []
    return extracted_files

# UI Components
async def show_chat_interface():
    st.header("💬 Code Chat Assistant")
    with st.container():
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
    if prompt := st.chat_input("Ask about data engineering or describe code to generate..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        with st.spinner("Thinking..."):
            model_name = st.session_state.loaded_model_id
            model = await ModelManager().get_model(model_name)
            if not model:
                st.error(f"Model {model_name} not loaded")
                return
            target_lang = st.session_state.get("chat_target_lang", "Python")
            if any(keyword in prompt.lower() for keyword in ["generate", "write", "create", "code"]):
                prompt = USE_CASE_CODE_PROMPT_COT.format(description=prompt, target_lang=target_lang)
            else:
                prompt = CHAT_PROMPT.format(query=prompt)
            messages = [{"role": "system", "content": "You are a data engineering expert."}, {"role": "user", "content": prompt[:MAX_PROMPT_LENGTH]}]
            try:
                response = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        executor,
                        lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_RESPONSE, temperature=TEMPERATURE_RESPONSE)["choices"][0]["message"]["content"].strip()
                    ),
                    timeout=LLM_TIMEOUT
                )
                with st.chat_message("assistant"):
                    st.markdown(response)
                    if "```" in response and st.session_state.get("enable_suggestions", False):
                        code = re.search(r"```(?:\w+\n)?(.*?)```", response, re.DOTALL)
                        if code and st.session_state.get("enable_suggestions", True):
                            if st.button("Copy Code", key=f"chat_copy_{uuid.uuid4()}"):
                                pyperclip.copy(code.group(1).strip())
                                st.success("Code copied to clipboard!")
                st.session_state.messages.append({"role": "assistant", "content": response})
            except asyncio.TimeoutError:
                st.error("Chat response timed out")
                logger.error(f"Chat response timed out for prompt: {prompt[:100]}...")

async def show_language_detection():
    st.header("🔍 Code Language Detection")
    col1, col2 = st.columns([1, 3])
    with col1:
        uploaded_file = st.file_uploader("Upload Code for Detection", type=["py", "sql", "scala", "r", "js", "ts", "sh", "ps1", "yaml", "json", "xml", "txt"], key="lang_detect_uploader")
        code_input = st.text_area("Or Paste Code Here", height=150, key="lang_detect_paste")
        use_llm = st.checkbox("Use LLM for Detection", value=False, key="lang_detect_llm")
    with col2:
        code = None
        if uploaded_file:
            code = uploaded_file.read().decode('utf-8')
        elif code_input.strip():
            code = code_input
        if code:
            with st.expander("Input Code"):
                st.code(code)
            if st.session_state.get("enable_suggestions", True):
                if st.button("Detect Language", key="lang_detect_button"):
                    with st.spinner("Detecting..."):
                        model = st.session_state.llm_model
                        if use_llm:
                            detected_lang = await detect_language_with_llm_async(code, model)
                        else:
                            detected_lang = await fallback_detection(code)
                        st.subheader("Detected Language")
                        st.write(f"**{detected_lang.value}**")

async def show_code_fixing():
    st.header("🛠️ Code Fixing")
    col1, col2 = st.columns([1, 3])
    with col1:
        uploaded_file = st.file_uploader("Upload Code to Fix", type=["py", "sql", "scala", "r", "js", "ts", "sh", "ps1", "yaml", "json", "xml", "txt"], key="code_fix_uploader")
        code_input = st.text_area("Or Paste Code Here", height=150, key="code_fix_paste")
        lang = st.selectbox("Select Language", [l.value for l in Language], index=0, key="code_fix_lang")
    with col2:
        code = None
        if uploaded_file:
            code = uploaded_file.read().decode('utf-8')
        elif code_input.strip():
            code = code_input
        if code:
            with st.expander("Original Code"):
                st.code(code)
            if st.session_state.get("enable_suggestions", True):
                if st.button("Fix Code", key="code_fix_button"):
                    with st.spinner("Fixing..."):
                        result = await fix_code_async(code, lang, st.session_state.loaded_model_id)
                        st.subheader("Fixed Code")
                        st.code(result["code"])
                        if st.session_state.get("enable_suggestions", False):
                            if st.button("Copy Fixed Code", key="code_fix_copy"):
                                pyperclip.copy(result["code"])
                                st.success("Code copied to clipboard!")
                        if result.get("validation"):
                            st.subheader("Validation Report")
                            st.markdown(result["validation"])
                        if st.session_state.get("enable_suggestions", True):
                            st.download_button(
                                "Download Fixed Code",
                                result["code"],
                                file_name=f"fixed_{lang.lower()}.txt",
                                key="code_fix_download"
                            )

async def show_code_debugging():
    st.header("🐞 Code Debugging")
    col1, col2 = st.columns([1, 3])
    with col1:
        uploaded_file = st.file_uploader("Upload Code to Debug", type=["py", "sql", "scala", "r", "js", "ts", "sh", "ps1", "yaml", "json", "xml", "txt"], key="code_debug_uploader")
        code_input = st.text_area("Or Paste Code Here", height=150, key="code_debug_paste")
        lang = st.selectbox("Select Language", [l.value for l in Language], index=0, key="code_debug_lang")
    with col2:
        code = None
        if uploaded_file:
            code = uploaded_file.read().decode('utf-8')
        elif code_input.strip():
            code = code_input
        if code:
            with st.expander("Original Code"):
                st.code(code)
            if st.session_state.get("enable_suggestions", True):
                if st.button("Debug Code", key="code_debug_button"):
                    with st.spinner("Debugging..."):
                        debug_analysis = await debug_code_async(code, lang, st.session_state.loaded_model_id, st.session_state.get("enable_suggestions", False))
                        st.subheader("Debug Analysis")
                        st.markdown(debug_analysis)
                        if st.session_state.get("enable_suggestions", False):
                            if st.button("Copy Debug Analysis", key="code_debug_copy"):
                                pyperclip.copy(debug_analysis)
                                st.success("Debug analysis copied to clipboard!")

async def show_enterprise_conversion():
    st.header("🧠 Enterprise Code Migration (CoT + Validation)")
    col1, col2 = st.columns([1, 3])
    with col1:
        conversion_type = st.selectbox(
            "Choose Conversion Type",
            list(ENTERPRISE_CONVERSION_TEMPLATES.keys()),
            format_func=lambda x: x.replace("_", " ➝ ").title(),
            key="conversion_type"
        )
        uploaded_file = st.file_uploader("Upload Legacy Code", type=["sql", "dsx", "txt"], key="conversion_uploader")
        code_input = st.text_area("Or Paste Code Here", height=150, key="conversion_paste")
        use_cot = st.checkbox("Use Chain-of-Thought", value=True, key="conversion_cot")
    with col2:
        code = None
        if uploaded_file:
            code = uploaded_file.read().decode('utf-8')
        elif code_input.strip():
            code = code_input
        if code:
            with st.expander("Original Code"):
                st.code(code)
            if st.session_state.get("enable_suggestions", True):
                if st.button("Run Migration", key="conversion_button"):
                    with st.spinner("Converting..."):
                        state = ConversionState(
                            code=code,
                            source_lang="auto",
                            target_lang=conversion_type.split("_to_")[1],
                            conversion_type=conversion_type
                        )
                        converter = EnterpriseConverter(ModelManager())
                        state = await converter.workflow.run(state)
                        st.subheader("✅ Converted Code")
                        st.code(state.converted_code)
                        if st.session_state.get("enable_suggestions", False):
                            if st.button("Copy Converted Code", key="conversion_copy"):
                                pyperclip.copy(state.converted_code)
                                st.success("Converted code copied to clipboard!")
                        if state.validation:
                            st.subheader("Validation Report")
                            st.markdown(state.validation)
                        if state.analysis and use_cot:
                            st.subheader("🧠 CoT Reasoning")
                            st.markdown(state.analysis)
                        if state.history:
                            st.subheader("Conversion History")
                            for hist in state.history:
                                st.markdown(f"**Iteration {hist['iteration']}**")
                                st.code(hist["code"], language=state.target_lang.lower())
                                st.markdown(f"**Validation**: {hist['validation']}")
                        code_files = [
                            {"name": "original.txt", "code": code},
                            {"name": "converted.txt", "code": state.converted_code},
                            {"name": "analysis.txt", "code": state.analysis or ""}
                        ]
                        code_files.extend([
                            {"name": f"history/iteration_{h['iteration']}.txt", "code": h["code"]}
                            for h in state.history
                        ])
                        zip_path = export_zip(code_files)
                        if st.session_state.get("enable_suggestions", True):
                            with open(zip_path, "rb") as f:
                                st.download_button(
                                    "Download ZIP (Code + Analysis + History)",
                                    f,
                                    file_name=f"migrated_{conversion_type}.zip",
                                    key="conversion_zip_download"
                                )
                        if st.session_state.get("enable_suggestions", True):
                            st.download_button(
                                "Download Converted Code",
                                state.converted_code,
                                file_name=f"migrated_{conversion_type}.txt",
                                key="conversion_download"
                            )

async def show_general_code_conversion():
    st.header("🔄 General Code Conversion (Source to Target)")
    col1, col2 = st.columns([1, 3])
    with col1:
        source_lang = st.selectbox(
            "Source Language",
            ["Auto"] + [l.value for l in Language],
            index=0,
            key="general_conversion_source_lang"
        )
        target_lang = st.selectbox(
            "Target Language",
            [l.value for l in Language],
            index=0,
            key="general_conversion_target_lang"
        )
        uploaded_file = st.file_uploader("Upload Code", type=["py", "sql", "scala", "r", "js", "ts", "sh", "ps1", "yaml", "json", "xml", "txt"], key="general_conversion_uploader")
        code_input = st.text_area("Or Paste Code Here", height=150, key="general_conversion_paste")
        use_cot = st.checkbox("Use Chain-of-Thought", value=True, key="general_conversion_cot")
    with col2:
        code = None
        if uploaded_file:
            code = uploaded_file.read().decode('utf-8')
        elif code_input.strip():
            code = code_input
        if code:
            with st.expander("Original Code"):
                st.code(code)
            if st.session_state.get("enable_suggestions", True):
                if st.button("Convert Code", key="general_conversion_button"):
                    with st.spinner("Converting..."):
                        state = ConversionState(
                            code=code,
                            source_lang=source_lang,
                            target_lang=target_lang,
                            conversion_type="general"
                        )
                        converter = EnterpriseConverter(ModelManager())
                        state = await converter.workflow.run(state)
                        st.subheader("✅ Converted Code")
                        st.code(state.converted_code)
                        if st.session_state.get("enable_suggestions", False):
                            if st.button("Copy Converted Code", key="general_conversion_copy"):
                                pyperclip.copy(state.converted_code)
                                st.success("Converted code copied to clipboard!")
                        if state.validation:
                            st.subheader("Validation Report")
                            st.markdown(state.validation)
                        if state.analysis and use_cot:
                            st.subheader("🧠 CoT Reasoning")
                            st.markdown(state.analysis)
                        if state.history:
                            st.subheader("Conversion History")
                            for hist in state.history:
                                st.markdown(f"**Iteration {hist['iteration']}**")
                                st.code(hist["code"], language=state.target_lang.lower())
                                st.markdown(f"**Validation**: {hist['validation']}")
                        code_files = [
                            {"name": "original.txt", "code": code},
                            {"name": "converted.txt", "code": state.converted_code},
                            {"name": "analysis.txt", "code": state.analysis or ""}
                        ]
                        code_files.extend([
                            {"name": f"history/iteration_{h['iteration']}.txt", "code": h["code"]}
                            for h in state.history
                        ])
                        zip_path = export_zip(code_files)
                        if st.session_state.get("enable_suggestions", True):
                            with open(zip_path, "rb") as f:
                                st.download_button(
                                    "Download ZIP (Code + Analysis + History)",
                                    f,
                                    file_name=f"converted_{source_lang}_to_{target_lang}.zip",
                                    key="general_conversion_zip_download"
                                )
                        if st.session_state.get("enable_suggestions", True):
                            st.download_button(
                                "Download Converted Code",
                                state.converted_code,
                                file_name=f"converted *[System]* {target_lang.lower()}.txt",
                                key="general_conversion_download"
                            )

async def show_use_case_code_generation():
    st.header("🚀 Use Case Code Generation")
    col1, col2 = st.columns([1, 3])
    with col1:
        description = st.text_area("Describe the Use Case (e.g., 'Aggregate sales by region')", height=150, key="use_case_description")
        target_lang = st.selectbox(
            "Target Language",
            [l.value for l in Language],
            index=[l.value for l in Language].index(st.session_state.use_case_target_lang),
            key="use_case_lang"
        )
        st.session_state.use_case_target_lang = target_lang
        use_cot = st.checkbox("Use Chain of Thought (CoT)", value=True, key="use_case_cot")
        do_generate = st.checkbox("Generate Code for Use Case", value=True, key="use_case_generate")
        do_debug = st.checkbox("Debug Code (Chain of Code Check)", value=True, key="use_case_debug")
        enable_suggestions = st.checkbox("Enable Suggestions (Debug, Best Practices, Copy/Download)", value=True, key="use_case_suggestions")
        st.session_state.enable_suggestions = enable_suggestions
        question = st.text_area("Ask a Question About Your Code (e.g., 'How to fix this bug?' or 'What features to enable?')", height=100, key="use_case_question")
        uploaded_zips = st.file_uploader("Upload ZIP(s) for Analysis", type=["zip"], accept_multiple_files=True, key="use_case_zip_uploader")
        uploaded_files = st.file_uploader("Upload Code Files", type=["py", "sql", "scala", "r", "js", "ts", "sh", "ps1", "yaml", "json", "xml", "txt"], accept_multiple_files=True, key="use_case_file_uploader")
        pasted_code = st.text_area("Paste Code Here for Analysis", height=150, key="use_case_paste")
        pasted_lang = st.selectbox("Pasted Code Language", ["Auto"] + [l.value for l in Language], index=0, key="use_case_paste_lang")
    with col2:
        with st.container():
            if st.session_state.questions:
                with st.expander("Question History"):
                    for idx, q in enumerate(st.session_state.questions):
                        st.write(f"**Question {idx + 1}**: {q['question']}")
                        st.markdown(f"**Answer**: {q['answer']}")
            if description.strip() or uploaded_zips or uploaded_files or pasted_code.strip() or question.strip():
                if st.session_state.get("enable_suggestions", True):
                    if st.button("Generate Code and Process Files", key="use_case_generate_button"):
                        with st.spinner("Processing..."):
                            try:
                                model_name = st.session_state.loaded_model_id
                                model = await ModelManager().get_model(model_name)
                                if not model:
                                    st.error(f"Model {model_name} not loaded")
                                    return
                                code_files = []
                                if question.strip():
                                    st.subheader("Question and Answer")
                                    combined_code = "\n".join([pasted_code.strip()] + [file.read().decode('utf-8') for file in uploaded_files if file] + [description.strip()])
                                    answer = await process_question(question, combined_code, model_name)
                                    st.markdown(answer)
                                    st.session_state.questions.append({"question": question, "answer": answer})
                                    code_files.append({
                                        "name": f"questions/question_{len(st.session_state.questions)}.md",
                                        "answer": f"**Question**: {question}\n\n**Answer**: {answer}"
                                    })
                                    if st.session_state.get("enable_suggestions", False):
                                        if st.button("Copy Answer", key=f"question_copy_{uuid.uuid4()}"):
                                            pyperclip.copy(answer)
                                            st.success("Answer copied to clipboard!")
                                if description.strip() and do_generate:
                                    prompt_template = USE_CASE_CODE_PROMPT_COT if use_cot else USE_CASE_CODE_PROMPT_NO_COT
                                    prompt = prompt_template.format(description=description, target_lang=target_lang)
                                    messages = [{"role": "system", "content": "You are a data engineering expert."}, {"role": "user", "content": prompt[:MAX_PROMPT_LENGTH]}]
                                    response = await asyncio.wait_for(
                                        asyncio.get_event_loop().run_in_executor(
                                            executor,
                                            lambda: model.create_chat_completion(messages=messages, max_tokens=MAX_TOKENS_RESPONSE, temperature=TEMPERATURE_RESPONSE)["choices"][0]["message"]["content"].strip()
                                        ),
                                        timeout=LLM_TIMEOUT
                                    )
                                    st.subheader("Generated Code")
                                    st.markdown(response)
                                    code = re.search(r"```(?:\w+\n)?(.*?)```", response, re.DOTALL)
                                    if code:
                                        code_content = code.group(1).strip()
                                        code_files.append({"name": "generated.txt", "code": code_content})
                                        code_files.append({"name": "reasoning.txt", "code": response})
                                        if do_debug and st.session_state.get("enable_suggestions", False):
                                            debug_analysis = await debug_code_async(code_content, target_lang, model_name, st.session_state.get("enable_suggestions", False))
                                            st.subheader("Generated Code Debug Analysis")
                                            st.markdown(debug_analysis)
                                            code_files.append({"name": "debug/generated.txt.md", "code": debug_analysis})
                                        if st.session_state.get("enable_suggestions", False):
                                            if st.button("Copy Generated Code", key="use_case_copy"):
                                                pyperclip.copy(code_content)
                                                st.success("Code copied to clipboard!")
                                    else:
                                        st.warning("No code block found in response.")
                                        code_files.append({"name": "description.txt", "code": description})
                                        code_files.append({"name": "response.txt", "code": response})
                                if uploaded_zips:
                                    st.subheader("ZIP Analysis Results")
                                    for zip_file in uploaded_zips:
                                        st.write(f"**Processing ZIP: {zip_file.name}**")
                                        extracted_files = await process_zip_file(zip_file, model_name, do_debug, st.session_state.get("enable_suggestions", False))
                                        for file in extracted_files:
                                            with st.expander(f"File: {file['name']}"):
                                                if "error" in file:
                                                    st.error(file["error"])
                                                else:
                                                    st.write(f"**Detected Language**: {file['detected_lang']}")
                                                    st.code(file["code"], language=file['detected_lang'].lower())
                                                    if st.session_state.get("enable_suggestions", False):
                                                        if st.button("Copy Original Code", key=f"original_copy_{uuid.uuid4()}"):
                                                            pyperclip.copy(file["code"])
                                                            st.success("Original code copied to clipboard!")
                                                    st.write(f"**Fixed Code**:")
                                                    st.code(file["fixed_code"], language=file['detected_lang'].lower())
                                                    if st.session_state.get("enable_suggestions", False):
                                                        if st.button("Copy Fixed Code", key=f"fixed_copy_{uuid.uuid4()}"):
                                                            pyperclip.copy(file["fixed_code"])
                                                            st.success("Fixed code copied to clipboard!")
                                                    if do_debug and st.session_state.get("enable_suggestions", False) and file["debug_analysis"]:
                                                        st.write(f"**Debug Analysis**:")
                                                        st.markdown(file["debug_analysis"])
                                                    if file["validation"]:
                                                        st.write(f"**Validation**: {file['validation']}")
                                                code_files.append({
                                                    "name": f"original/{file['name']}",
                                                    "code": file.get("code", file.get("error", ""))
                                                })
                                                if "fixed_code" in file:
                                                    code_files.append({
                                                        "name": f"fixed/{file['name']}",
                                                        "code": file["fixed_code"]
                                                    })
                                                if "debug_analysis" in file and do_debug and st.session_state.get("enable_suggestions", False):
                                                    code_files.append({
                                                        "name": f"debug/{file['name']}.md",
                                                        "code": file["debug_analysis"]
                                                    })
                                if uploaded_files:
                                    st.subheader("Individual File Analysis Results")
                                    for file in uploaded_files:
                                        file_result = await process_individual_file(file, model_name, do_debug, st.session_state.get("enable_suggestions", False))
                                        with st.expander(f"File: {file_result['name']}"):
                                            if "error" in file_result:
                                                st.error(file_result["error"])
                                            else:
                                                st.write(f"**Detected Language**: {file_result['detected_lang']}")
                                                st.code(file_result["code"], language=file_result['detected_lang'].lower())
                                                if st.session_state.get("enable_suggestions", False):
                                                    if st.button("Copy Original Code", key=f"original_copy_{uuid.uuid4()}"):
                                                        pyperclip.copy(file_result["code"])
                                                        st.success("Original code copied to clipboard!")
                                                st.write(f"**Fixed Code**:")
                                                st.code(file_result["fixed_code"], language=file_result['detected_lang'].lower())
                                                if st.session_state.get("enable_suggestions", False):
                                                    if st.button("Copy Fixed Code", key=f"fixed_copy_{uuid.uuid4()}"):
                                                        pyperclip.copy(file_result["fixed_code"])
                                                        st.success("Fixed code copied to clipboard!")
                                                if do_debug and st.session_state.get("enable_suggestions", False) and file_result["debug_analysis"]:
                                                    st.write(f"**Debug Analysis**:")
                                                    st.markdown(file_result["debug_analysis"])
                                                if file_result["validation"]:
                                                    st.write(f"**Validation**: {file_result['validation']}")
                                            code_files.append({
                                                "name": f"original/{file_result['name']}",
                                                "code": file_result.get("code", file_result.get("error", ""))
                                            })
                                            if "fixed_code" in file_result:
                                                code_files.append({
                                                    "name": f"fixed/{file_result['name']}",
                                                    "code": file_result["fixed_code"]
                                                })
                                            if "debug_analysis" in file_result and do_debug and st.session_state.get("enable_suggestions", False):
                                                code_files.append({
                                                    "name": f"debug/{file_result['name']}.md",
                                                    "code": file_result["debug_analysis"]
                                                })
                                if pasted_code.strip():
                                    st.subheader("Pasted Code Analysis Results")
                                    pasted_result = await process_pasted_code(pasted_code, pasted_lang, model_name, do_debug, st.session_state.get("enable_suggestions", False))
                                    with st.expander(f"File: {pasted_result['name']}"):
                                        if "error" in pasted_result:
                                            st.error(pasted_result["error"])
                                        else:
                                            st.write(f"**Detected Language**: {pasted_result['detected_lang']}")
                                            st.code(pasted_result["code"], language=pasted_result['detected_lang'].lower())
                                            if st.session_state.get("enable_suggestions", False):
                                                if st.button("Copy Original Code", key=f"original_copy_{uuid.uuid4()}"):
                                                    pyperclip.copy(pasted_result["code"])
                                                    st.success("Original code copied to clipboard!")
                                            st.write(f"**Fixed Code**:")
                                            st.code(pasted_result["fixed_code"], language=pasted_result['detected_lang'].lower())
                                            if st.session_state.get("enable_suggestions", False):
                                                if st.button("Copy Fixed Code", key=f"fixed_copy_{uuid.uuid4()}"):
                                                    pyperclip.copy(pasted_result["fixed_code"])
                                                    st.success("Fixed code copied to clipboard!")
                                            if do_debug and st.session_state.get("enable_suggestions", False) and pasted_result["debug_analysis"]:
                                                st.write(f"**Debug Analysis**:")
                                                st.markdown(pasted_result["debug_analysis"])
                                            if pasted_result["validation"]:
                                                st.write(f"**Validation**: {pasted_result['validation']}")
                                        code_files.append({
                                            "name": f"original/{pasted_result['name']}",
                                            "code": pasted_result.get("code", pasted_result.get("error", ""))
                                        })
                                        if "fixed_code" in pasted_result:
                                            code_files.append({
                                                "name": f"fixed/{pasted_result['name']}",
                                                "code": pasted_result["fixed_code"]
                                            })
                                        if "debug_analysis" in pasted_result and do_debug and st.session_state.get("enable_suggestions", False):
                                            code_files.append({
                                                "name": f"debug/{pasted_result['name']}.md",
                                                "code": pasted_result["debug_analysis"]
                                            })
                                if code_files:
                                    zip_path = export_zip(code_files)
                                    if st.session_state.get("enable_suggestions", True):
                                        with open(zip_path, "rb") as f:
                                            st.download_button(
                                                "Download ZIP (Code + Analysis)",
                                                f,
                                                file_name=f"processed_{target_lang.lower()}.zip",
                                                key="use_case_zip_download"
                                            )
                                    if description.strip() and do_generate and code and st.session_state.get("enable_suggestions", True):
                                        st.download_button(
                                            "Download Generated Code",
                                            code_content,
                                            file_name=f"generated_{target_lang.lower()}.txt",
                                            key="use_case_download"
                                        )
                            except Exception as e:
                                st.error(f"Error processing: {e}")
                                logger.error(f"Processing error: {e}")
                                code_files = [
                                    {"name": "description.txt", "code": description or "No description"},
                                    {"name": "error.txt", "code": str(e)}
                                ]
                                zip_path = export_zip(code_files)
                                if st.session_state.get("enable_suggestions", True):
                                    with open(zip_path, "rb") as f:
                                        st.download_button(
                                            "Download ZIP (Description + Error)",
                                            f,
                                            file_name=f"failed_{target_lang.lower()}.zip",
                                            key="use_case_zip_fallback"
                                        )

async def show_bulk_processing():
    st.header("📁 Bulk Code Processing (ZIP)")
    col1, col2 = st.columns([1, 3])
    with col1:
        uploaded_zip = st.file_uploader("Upload ZIP of Code Files", type=["zip"], key="bulk_zip")
        process_type = st.selectbox(
            "Processing Type",
            ["Fix & Debug", "Enterprise Migration"],
            key="bulk_process_type"
        )
        target_lang = st.selectbox(
            "Target Language (Migration)",
            [l.value for l in Language],
            disabled=(process_type != "Enterprise Migration"),
            key="bulk_target_lang"
        )
    with col2:
        if uploaded_zip and st.session_state.get("enable_suggestions", True):
            if st.button("Process Files", key="bulk_process"):
                with st.spinner("Processing ZIP..."):
                    with tempfile.TemporaryDirectory() as tmpdir:
                        with zipfile.ZipFile(uploaded_zip) as zip_ref:
                            zip_ref.extractall(tmpdir)
                        converter = EnterpriseConverter(ModelManager())
                        results = []
                        total_files = sum(1 for _, _, files in os.walk(tmpdir) for f in files if not f.startswith("."))
                        progress_bar = st.progress(0)
                        processed_files = 0
                        for root, _, files in os.walk(tmpdir):
                            for file in files:
                                if file.startswith("."):
                                    continue
                                file_path = Path(root) / file
                                encodings = ['utf-8', 'latin1']
                                code = None
                                for encoding in encodings:
                                    try:
                                        with open(file_path, 'r', encoding=encoding) as f:
                                            code = f.read()
                                            break
                                    except UnicodeDecodeError:
                                        continue
                                if code is None:
                                    results.append({
                                        "filename": file,
                                        "path": str(file_path),
                                        "error": "Failed to decode file with available encodings"
                                    })
                                    continue
                                if len(code) > MAX_CODE_LENGTH:
                                    code = code[:MAX_CODE_LENGTH]
                                    logger.warning(f"Truncated file {file} to {MAX_CODE_LENGTH} characters")
                                result = {"filename": file, "path": str(file_path)}
                                if process_type == "Fix & Debug":
                                    lang = await detect_language_with_llm_async(code, st.session_state.llm_model)
                                    fix_result = await fix_code_async(code, lang.value, st.session_state.loaded_model_id)
                                    debug_result = await debug_code_async(code, lang.value, st.session_state.loaded_model_id, st.session_state.get("enable_suggestions", False))
                                    result.update({
                                        "original": code,
                                        "detected_lang": lang.value,
                                        "fixed_code": fix_result["code"],
                                        "validation": fix_result["validation"],
                                        "debug": debug_result
                                    })
                                elif process_type == "Enterprise Migration":
                                    state = ConversionState(
                                        code=code,
                                        source_lang="auto",
                                        target_lang=target_lang,
                                        conversion_type="general" if target_lang.lower() not in ENTERPRISE_CONVERSION_TEMPLATES else f"hive_to_{target_lang.lower()}"
                                    )
                                    state = await converter.workflow.run(state)
                                    result.update({
                                        "original": code,
                                        "converted": state.converted_code,
                                        "iterations": state.iteration,
                                        "history": state.history,
                                        "final_validation": state.validation
                                    })
                                results.append(result)
                                processed_files += 1
                                progress_bar.progress(min(processed_files / total_files, 1.0))
                        progress_bar.empty()
                        st.subheader("Processing Results")
                        tab1, tab2 = st.tabs(["File Summary", "Detailed View"])
                        with tab1:
                            for res in results:
                                st.markdown(f"""
                                **{res['filename']}**
                                - Status: {len(res.get('history', [])) or 1} iteration(s)
                                - Final Validation: {res.get('final_validation', res.get('validation', 'N/A'))}
                                """)
                        with tab2:
                            for res in results:
                                with st.expander(f"File: {res['filename']}"):
                                    if "error" in res:
                                        st.error(res["error"])
                                    elif process_type == "Fix & Debug":
                                        st.subheader("Original Code")
                                        st.code(res["original"], language=res["detected_lang"].lower())
                                        st.subheader("Fixed Code")
                                        st.code(res["fixed_code"], language=res["detected_lang"].lower())
                                        st.subheader("Debug Analysis")
                                        st.markdown(res["debug"])
                                        if st.session_state.get("enable_suggestions", False):
                                            if st.button("Copy Fixed Code", key=f"bulk_fix_copy_{uuid.uuid4()}"):
                                                pyperclip.copy(res["fixed_code"])
                                                st.success("Fixed code copied to clipboard!")
                                    elif process_type == "Enterprise Migration":
                                        st.subheader("Original Code")
                                        st.code(res["original"], language="sql")
                                        st.subheader("Conversion History")
                                        for hist in res["history"]:
                                            st.markdown(f"""
                                            **Iteration {hist['iteration']}**
                                            ```{target_lang.lower()}
                                            {hist['code']}
                                            ```
                                            Validation: {hist['validation']}
                                            """)
                                        st.subheader("Final Converted Code")
                                        st.code(res["converted"], language=target_lang.lower())
                                        if st.session_state.get("enable_suggestions", False):
                                            if st.button("Copy Converted Code", key=f"bulk_conv_copy_{uuid.uuid4()}"):
                                                pyperclip.copy(res["converted"])
                                                st.success("Converted code copied to clipboard!")
                        zip_path = export_zip([{
                            "name": f"processed/{res['filename']}",
                            "code": res.get("fixed_code", res.get("converted", res.get("error", "")))
                        } for res in results] + [{
                            "name": f"original/{res['filename']}",
                            "code": res.get("original", res.get("error", ""))
                        } for res in results])
                        if st.session_state.get("enable_suggestions", True):
                            with open(zip_path, "rb") as f:
                                st.download_button(
                                    "Download Processed Files",
                                    f,
                                    file_name="processed_results.zip",
                                    key="bulk_zip_download"
                                )

# Main Application Flow
async def main_flow():
    st.set_page_config(page_title="Data Engineering Assistant", layout="wide")
    st.title("🧑💻 Multi-Function Code Assistant")
    asyncio.create_task(periodic_cleanup())
    with st.sidebar:
        st.header("Configuration")
        available_models = {
            name: path 
            for name, path in MODELS.items() 
            if ModelManager()._validate_model(name)
        }
        if not available_models:
            st.error("No valid models found! Check model files.")
            return
        selected_model = st.selectbox("Choose Model", list(available_models.keys()), key="model_select")
        st.slider("Max Tokens", 64, 4096, MAX_TOKENS_RESPONSE, key="max_tokens")
        st.selectbox("Chat Target Language", [l.value for l in Language], index=0, key="chat_target_lang")
    if st.session_state.loaded_model_id != selected_model or not st.session_state.llm_model:
        with st.spinner(f"Loading {selected_model}..."):
            model = await ModelManager().get_model(selected_model)
            if not model:
                st.error(f"Failed to load {selected_model}")
                st.session_state.clear()
                return
            st.session_state.llm_model = model