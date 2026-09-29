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
import traceback
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
import threading

# Logging Setup
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.FileHandler("chatbot.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Path Configuration (Summarized)
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
            try:
                path.mkdir(parents=True, exist_ok=True)
                if not os.access(path, os.R_OK | os.W_OK):
                    logger.error(f"No read/write permissions for {path}")
                    raise PermissionError(f"No read/write permissions for {path}")
                logger.debug(f"Validated path: {path}")
            except Exception as e:
                logger.error(f"Failed to validate path {path}: {e}")
                raise

try:
    AppPaths.validate_paths()
except Exception as e:
    st.error(f"Path validation failed: {e}")
    raise

# Configuration Constants
BATCH_SIZE = 2048
MAX_CONCURRENT = 1  # Reduced to prevent resource exhaustion
MAX_GPU_LAYERS = 0
MODEL_CONTEXT_SIZE = 8192
MAX_PROMPT_LENGTH = 8000
MAX_TOKENS_RESPONSE = 800
MAX_TOKENS_DETECTION = 10
MAX_TOKENS_CONVERSION = 1000
TEMPERATURE_DETECTION = 0.0
TEMPERATURE_RESPONSE = 0.65
TEMPERATURE_CONVERSION = 0.3
MAX_CODE_LENGTH = 50000
LLM_TIMEOUT = 600

# Thread Pool
executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT, thread_name_prefix="CodeGenWorker")
def monitor_thread_pool():
    active_threads = len(executor._threads)
    logger.debug(f"Active threads in ThreadPoolExecutor: {active_threads}/{MAX_CONCURRENT}")
monitor_thread_pool()

# Periodic Cleanup
def run_periodic_cleanup():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    while True:
        loop.run_until_complete(asyncio.sleep(300))
        gc.collect()
        logger.debug("Performed GC cleanup")
threading.Thread(target=run_periodic_cleanup, daemon=True).start()

# Memory Safety Decorator
def memory_safe(func):
    async def wrapper(*args, **kwargs):
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        logger.debug(f"Memory before {func.__name__}: {mem.percent}% used, Swap: {swap.percent}%")
        if mem.percent > 85:
            logger.error(f"Memory critical: {mem.percent}% used")
            st.error("System memory is too high. Please free up resources and try again.")
            return None
        if swap.percent > 50:
            logger.warning(f"High swap usage: {swap.percent}%")
        start_time = asyncio.get_event_loop().time()
        try:
            result = await func(*args, **kwargs)
            elapsed = asyncio.get_event_loop().time() - start_time
            logger.debug(f"Function {func.__name__} completed in {elapsed:.2f} seconds")
            mem_after = psutil.virtual_memory()
            logger.debug(f"Memory after {func.__name__}: {mem_after.percent}% used")
            return result
        except Exception as e:
            logger.error(f"Function {func.__name__} failed: {e}\n{traceback.format_exc()}")
            st.error(f"Operation failed: {str(e)}")
            return None
    return wrapper

# Text Splitters (Summarized)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=2048, chunk_overlap=256, separators=["\n\nclass ", "\n\ndef ", "\n\nasync ", "\n\n#", "\n\n//", "\n\n/*", "\n\n--", "\n\n"])
emergency_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)

# Prompt Templates (Summarized)
LANGUAGE_DETECTION_TEMPLATE = """
[STRICT FORMAT] Identify the programming language from this code.
Options: Python, PySpark, Spark SQL, BigQuery SQL, Snowflake SQL, Databricks SQL, PostgreSQL, MySQL, 
Oracle SQL, T-SQL, Standard SQL, Scala, R, Julia, JavaScript, TypeScript, Shell, PowerShell, YAML, JSON, XML
Return ONLY the language name in format: [Language: XXXX]
Code:
{code}
"""
LANGUAGE_DETECTION_PROMPT = PromptTemplate(input_variables=["code"], template=LANGUAGE_DETECTION_TEMPLATE)
# Other templates (CHAT, QUESTION, USE_CASE_CODE, etc.) remain unchanged

# Enterprise Conversion Templates (Summarized)
ENTERPRISE_CONVERSION_TEMPLATES = {
    "hive_to_bigquery": {
        "cot_prompt": """Convert HiveQL to BigQuery SQL...""",
        "final_prompt": "Generate final BigQuery SQL:",
        "validation_rules": [("LATERAL VIEW EXPLODE", "UNNEST"), ("dt BETWEEN", "_PARTITIONTIME BETWEEN")]
    },
    "general": {
        "cot_prompt": """Convert {source_lang} code to {target_lang} code...""",
        "final_prompt": "Generate final {target_lang} code:",
        "validation_rules": []
    }
}

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

    @memory_safe
    async def get_model(self, model_name: str) -> Optional[Llama]:
        if not model_name:
            logger.error("No model name provided")
            return None
        if model_name in self.models:
            logger.debug(f"Returning cached model: {model_name}")
            return self.models[model_name]
        if not self._validate_model(model_name):
            logger.error(f"Model {model_name} validation failed")
            return None
        cache_path = AppPaths.MODEL_CACHE_DIR / f"{model_name}.cache"
        if await self._try_load_cache(model_name, cache_path):
            return self.models[model_name]
        return await self._load_fresh_model(model_name, cache_path)

    def _validate_model(self, model_name: str) -> bool:
        model_path = MODELS.get(model_name)
        valid = True
        if not model_path:
            logger.error(f"Model {model_name} not in configuration")
            valid = False
        elif not model_path.exists():
            logger.error(f"Model file missing: {model_path}")
            valid = False
        elif not os.access(model_path, os.R_OK):
            logger.error(f"No read permissions for model file: {model_path}")
            valid = False
        self._model_checks[model_name] = valid
        return valid

    @memory_safe
    async def _try_load_cache(self, model_name: str, cache_path: Path) -> bool:
        if not cache_path.exists():
            logger.debug(f"No cache found for {model_name}")
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
            logger.error(f"Cache load failed for {model_name}: {e}\n{traceback.format_exc()}")
            return False

    def _load_cache_file(self, cache_path: Path):
        with lzma.open(cache_path, 'rb') as f:
            model = pickle.load(f)
        if not hasattr(model, 'model_path'):
            raise ValueError("Invalid cache format")
        return model

    @memory_safe
    async def _load_fresh_model(self, model_name: str, cache_path: Path) -> Optional[Llama]:
        for attempt in range(3):
            try:
                model_path = MODELS[model_name]
                logger.debug(f"Loading model {model_name} from {model_path}")
                model = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: Llama(
                        model_path=str(model_path),
                        n_ctx=MODEL_CONTEXT_SIZE,
                        n_threads=MAX_CONCURRENT,
                        n_gpu_layers=MAX_GPU_LAYERS,
                        n_batch=BATCH_SIZE,
                        verbose=True
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
                logger.error(f"Attempt {attempt + 1} failed to load {model_name}: {e}\n{traceback.format_exc()}")
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
            logger.error(f"Failed to save {model_name} cache: {e}\n{traceback.format_exc()}")

    def _serialize_model(self, model: Llama, cache_path: Path):
        with lzma.open(cache_path, 'wb') as f:
            pickle.dump(model, f, protocol=4)

    @memory_safe
    async def _warmup_model(self, model: Llama):
        try:
            await asyncio.get_event_loop().run_in_executor(
                executor,
                lambda: model.create_chat_completion(
                    messages=[{"role": "user", "content": "1+1="}],
                    max_tokens=2
                )
            )
            logger.debug("Model warmup successful")
        except Exception as e:
            logger.warning(f"Model warmup failed: {e}\n{traceback.format_exc()}")

# Model Discovery (Summarized)
def discover_models():
    model_map = {}
    try:
        for model_dir in AppPaths.MODELS_DIR.iterdir():
            if not model_dir.is_dir():
                continue
            gguf_files = list(model_dir.glob("*.gguf"))
            if gguf_files:
                model_name = model_dir.name.replace("_", "-")
                model_map[model_name] = gguf_files[0]
                logger.info(f"Discovered model {model_name}: {gguf_files[0]}")
        if not model_map:
            logger.error("No valid models found in MODELS_DIR")
    except Exception as e:
        logger.error(f"Failed to scan MODELS_DIR: {e}")
    return model_map

MODELS = discover_models()

# Conversion State
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

# Enterprise Converter
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

    @memory_safe
    async def detect_language(self, state: ConversionState) -> ConversionState:
        try:
            if not state.source_lang or state.source_lang.lower() == "auto":
                model = await self.model_manager.get_model(st.session_state.loaded_model_id)
                if model:
                    lang = await detect_language_with_llm_async(state.code, model)
                    state.source_lang = lang.value
                else:
                    state.source_lang = "Unknown"
            return state
        except Exception as e:
            logger.error(f"Language detection failed: {e}\n{traceback.format_exc()}")
            state.source_lang = "Unknown"
            return state

    @memory_safe
    async def analyze_code(self, state: ConversionState) -> ConversionState:
        try:
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
        except Exception as e:
            logger.error(f"Code analysis failed: {e}\n{traceback.format_exc()}")
            state.analysis = f"Error: Analysis failed - {str(e)}"
            return state

    @memory_safe
    async def convert_code(self, state: ConversionState) -> ConversionState:
        try:
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
            state.converted_code = await self.generate_response(
                prompt,
                st.session_state.loaded_model_id,
                MAX_TOKENS_CONVERSION,
                0.1,
                0.9
            )
            state.iteration += 1
            return state
        except asyncio.TimeoutError:
            logger.warning("Conversion timeout, reducing chunk size")
            state.code = text_splitter.split_text(state.code)[0]
            return await self.convert_code(state)
        except Exception as e:
            logger.error(f"Code conversion failed: {e}\n{traceback.format_exc()}")
            state.converted_code = f"Error: Conversion failed - {str(e)}"
            return state

    @memory_safe
    async def validate_code(self, state: ConversionState) -> ConversionState:
        try:
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
        except Exception as e:
            logger.error(f"Validation failed: {e}\n{traceback.format_exc()}")
            state.validation = f"Error: Validation failed - {str(e)}"
            return state

    def decide_to_retry(self, state: ConversionState) -> str:
        try:
            if "❌" in state.validation and state.iteration < 3:
                return "retry"
            return "done"
        except Exception:
            return "done"

    @memory_safe
    async def finalize_conversion(self, state: ConversionState) -> ConversionState:
        try:
            if state.target_lang.lower() == "pyspark" and "from pyspark.sql import SparkSession" not in state.converted_code:
                state.converted_code = f"from pyspark.sql import SparkSession\n\n{state.converted_code}"
            return state
        except Exception as e:
            logger.error(f"Finalization failed: {e}\n{traceback.format_exc()}")
            state.converted_code = f"Error: Finalization failed - {str(e)}"
            return state

    async def generate_response(self, prompt: str, model_name: str, max_tokens: int, temp: float, top_p: float) -> str:
        try:
            model = await self.model_manager.get_model(model_name)
            if not model:
                logger.error(f"Model {model_name} not loaded")
                return f"Error: Model {model_name} not loaded"
            chunks = text_splitter.split_text(prompt[:MAX_PROMPT_LENGTH])
            responses = []
            timeout = min(LLM_TIMEOUT, 150 + len(prompt) // 100)
            for chunk in chunks:
                messages = [{"role": "system", "content": "You are a data engineering expert."}, {"role": "user", "content": chunk}]
                try:
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
                except Exception as e:
                    logger.error(f"LLM generation failed: {e}\n{traceback.format_exc()}")
                    responses.append(f"Error: {e}")
            return "\n".join(responses)
        except Exception as e:
            logger.error(f"Generate response failed: {e}\n{traceback.format_exc()}")
            return f"Error: {str(e)}"

    def validate_converted_code(self, converted_code: str, target_lang: str, conversion_type: str) -> str:
        try:
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
        except Exception as e:
            logger.error(f"Code validation failed: {e}\n{traceback.format_exc()}")
            return f"Error: Validation failed - {str(e)}"

# Language Detection
@memory_safe
async def detect_language_with_llm_async(code: str, model: Llama) -> Language:
    try:
        if not model:
            logger.error("No model provided for language detection")
            return Language.UNKNOWN
        prompt = LANGUAGE_DETECTION_PROMPT.format(code=code[:MAX_PROMPT_LENGTH])
        messages = [{"role": "system", "content": "Return only the language name in specified format."}, {"role": "user", "content": prompt}]
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
            try:
                return Language[lang.replace(" ", "_").upper()]
            except KeyError:
                logger.warning(f"Unknown language detected: {lang}")
                return Language.UNKNOWN
        first_line = response.split("\n")[0].strip(" .")
        try:
            return Language[first_line.replace(" ", "_").upper()]
        except KeyError:
            logger.warning(f"Invalid language response: {first_line}")
            return await fallback_detection(code)
    except (KeyError, asyncio.TimeoutError, ValueError) as e:
        logger.error(f"Language detection failed: {e}\n{traceback.format_exc()}")
        return await fallback_detection(code)

async def fallback_detection(code: str) -> Language:
    try:
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
                logger.debug(f"Fallback detected language: {lang.value}")
                return lang
        logger.debug("Fallback detection returned UNKNOWN")
        return Language.UNKNOWN
    except Exception as e:
        logger.error(f"Fallback detection failed: {e}\n{traceback.format_exc()}")
        return Language.UNKNOWN

# Code Fixing
@memory_safe
async def fix_code_async(code: str, lang: str, model_name: str) -> Dict[str, str]:
    try:
        model = await ModelManager().get_model(model_name)
        if not model:
            logger.error(f"Model {model_name} not loaded for code fixing")
            return {"error": f"Model {model_name} not loaded", "code": code}
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
            except Exception as e:
                logger.error(f"Code fixing failed for chunk: {e}\n{traceback.format_exc()}")
                fixed_chunks.append(chunk)
        fixed_code = "\n".join(fixed_chunks)
        validation_msg = EnterpriseConverter(ModelManager()).validate_converted_code(fixed_code, lang, None)
        return {
            "code": fixed_code,
            "validation": validation_msg
        }
    except Exception as e:
        logger.error(f"Code fixing failed: {e}\n{traceback.format_exc()}")
        return {"error": str(e), "code": code}

@memory_safe
async def process_with_emergency_split(code: str, lang: str, model_name: str) -> Dict[str, str]:
    try:
        model = await ModelManager().get_model(model_name)
        if not model:
            logger.error(f"Model {model_name} not loaded for emergency split")
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
            except Exception as e:
                logger.error(f"Emergency fixing failed: {e}\n{traceback.format_exc()}")
                fixed_chunks.append(chunk)
        fixed_code = "\n".join(fixed_chunks)
        return {"code": fixed_code, "validation": "Emergency split applied"}
    except Exception as e:
        logger.error(f"Emergency split processing failed: {e}\n{traceback.format_exc()}")
        return {"error": str(e), "code": code}

# UI Components
@memory_safe
async def show_chat_interface():
    try:
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
                except Exception as e:
                    st.error(f"Chat response failed: {e}")
                    logger.error(f"Chat response failed: {e}\n{traceback.format_exc()}")
    except Exception as e:
        logger.error(f"Chat interface failed: {e}\n{traceback.format_exc()}")
        st.error(f"Chat interface failed: {str(e)}")

@memory_safe
async def show_enterprise_conversion():
    try:
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
                try:
                    code = uploaded_file.read().decode('utf-8')
                except Exception as e:
                    st.error(f"Failed to read uploaded file: {e}")
                    logger.error(f"Failed to read uploaded file: {e}\n{traceback.format_exc()}")
            elif code_input.strip():
                code = code_input
            if code:
                with st.expander("Original Code"):
                    st.code(code)
                if st.session_state.get("enable_suggestions", True):
                    if st.button("Run Migration", key="conversion_button"):
                        with st.spinner("Converting..."):
                            try:
                                state = ConversionState(
                                    code=code,
                                    source_lang="auto",
                                    target_lang=conversion_type.split("_to_")[1],
                                    conversion_type=conversion_type
                                )
                                converter = EnterpriseConverter(ModelManager())
                                state = await converter.workflow.invoke(state)
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
                                    {"name": f"history/iteration_{h['iteration']}.txt", "code": h['code']}
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
                            except Exception as e:
                                st.error(f"Conversion failed: {e}")
                                logger.error(f"Conversion failed: {e}\n{traceback.format_exc()}")
    except Exception as e:
        logger.error(f"Enterprise conversion failed: {e}\n{traceback.format_exc()}")
        st.error(f"Enterprise conversion failed: {str(e)}")

@memory_safe
async def show_general_code_conversion():
    try:
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
                try:
                    code = uploaded_file.read().decode('utf-8')
                except Exception as e:
                    st.error(f"Failed to read uploaded file: {e}")
                    logger.error(f"Failed to read uploaded file: {e}\n{traceback.format_exc()}")
            elif code_input.strip():
                code = code_input
            if code:
                with st.expander("Original Code"):
                    st.code(code)
                if st.session_state.get("enable_suggestions", True):
                    if st.button("Convert Code", key="general_conversion_button"):
                        with st.spinner("Converting..."):
                            try:
                                state = ConversionState(
                                    code=code,
                                    source_lang=source_lang,
                                    target_lang=target_lang,
                                    conversion_type="general"
                                )
                                converter = EnterpriseConverter(ModelManager())
                                state = await converter.workflow.invoke(state)
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
                                    {"name": f"history/iteration_{h['iteration']}.txt", "code": h['code']}
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
                                        file_name=f"converted_{target_lang.lower()}.txt",
                                        key="general_conversion_download"
                                    )
                            except Exception as e:
                                st.error(f"Conversion failed: {e}")
                                logger.error(f"Conversion failed: {e}\n{traceback.format_exc()}")
    except Exception as e:
        logger.error(f"General conversion failed: {e}\n{traceback.format_exc()}")
        st.error(f"General conversion failed: {str(e)}")

# ZIP Export
def export_zip(code_files: List[Dict[str, str]]) -> str:
    try:
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
            logger.debug(f"Created ZIP file: {temp_zip.name}")
            return temp_zip.name
    except Exception as e:
        logger.error(f"Failed to create ZIP: {e}\n{traceback.format_exc()}")
        raise

# Main Flow
async def main_flow():
    try:
        st.set_page_config(page_title="CodeGen Assistant", layout="wide")
        
        # Initialize Session State
        if "messages" not in st.session_state:
            st.session_state.messages = []
        if "llm_model" not in st.session_state:
            st.session_state.llm_model = None
        if "loaded_model_id" not in st.session_state:
            st.session_state.loaded_model_id = None
        if "device" not in st.session_state:
            st.session_state.device = "cpu"
        if "code_files" not in st.session_state:
            st.session_state.code_files = []
        if "use_case_target_lang" not in st.session_state:
            st.session_state.use_case_target_lang = "Python"
        if "questions" not in st.session_state:
            st.session_state.questions = []
        if "enable_suggestions" not in st.session_state:
            st.session_state.enable_suggestions = True
        if "chat_target_lang" not in st.session_state:
            st.session_state.chat_target_lang = "Python"

        st.title("🚀 CodeGen Assistant")
        
        # Model Selection
        model_options = list(MODELS.keys())
        if not model_options:
            st.error("No models found in MODELS_DIR. Please check configuration.")
            return
        selected_model = st.selectbox("Select Model", model_options, key="model_select")
        if selected_model != st.session_state.loaded_model_id:
            with st.spinner("Loading model..."):
                model_manager = ModelManager()
                model = await model_manager.get_model(selected_model)
                if model:
                    st.session_state.loaded_model_id = selected_model
                    st.session_state.llm_model = model
                    st.success(f"Model {selected_model} loaded successfully!")
                else:
                    st.error(f"Failed to load model {selected_model}")
                    return

        # Tabs
        tabs = st.tabs([
            "Chat", "Language Detection", "Code Fixing", "Code Debugging",
            "Enterprise Conversion", "General Conversion", "Use Case Generation"
        ])

        with tabs[0]:
            await show_chat_interface()
        with tabs[1]:
            await show_language_detection()
        with tabs[2]:
            await show_code_fixing()
        with tabs[3]:
            await show_code_debugging()
        with tabs[4]:
            await show_enterprise_conversion()
        with tabs[5]:
            await show_general_code_conversion()
        with tabs[6]:
            await show_use_case_code_generation()

    except Exception as e:
        logger.error(f"Main flow failed: {e}\n{traceback.format_exc()}")
        st.error(f"Application failed to start: {str(e)}")

# Unchanged UI Functions (Summarized)
@memory_safe
async def show_language_detection():
    try:
        st.header("🔍 Code Language Detection")
        # Implementation remains as provided
    except Exception as e:
        logger.error(f"Language detection UI failed: {e}\n{traceback.format_exc()}")
        st.error(f"Language detection failed: {str(e)}")

@memory_safe
async def show_code_fixing():
    try:
        st.header("🛠️ Code Fixing")
        # Implementation remains as provided
    except Exception as e:
        logger.error(f"Code fixing UI failed: {e}\n{traceback.format_exc()}")
        st.error(f"Code fixing failed: {str(e)}")

@memory_safe
async def show_code_debugging():
    try:
        st.header("🐞 Code Debugging")
        # Implementation remains as provided
    except Exception as e:
        logger.error(f"Code debugging UI failed: {e}\n{traceback.format_exc()}")
        st.error(f"Code debugging failed: {str(e)}")

@memory_safe
async def show_use_case_code_generation():
    try:
        st.header("🚀 Use Case Code Generation")
        # Implementation remains as provided, with completion of pasted code section
        if pasted_code.strip():
            st.subheader("Pasted Code Analysis Results")
            pasted_result = await process_pasted_code(
                pasted_code,
                pasted_lang,
                model_name,
                do_debug,
                st.session_state.get("enable_suggestions", False)
            )
            with st.expander("Pasted Code"):
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
    except Exception as e:
        logger.error(f"Use case generation failed: {e}\n{traceback.format_exc()}")
        st.error(f"Use case generation failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main_flow())