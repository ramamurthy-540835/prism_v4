
from diagrams import Diagram
from diagrams.c4 import Person, Container, SystemBoundary, Relationship
from diagrams.onprem.mlops import Mlflow
from diagrams.onprem.analytics import Dbt
from diagrams.gcp.compute import Run
from diagrams.gcp.ml import AIPlatform
from diagrams.gcp.devtools import Scheduler
from diagrams.gcp.analytics import Bigquery, Looker
from diagrams.gcp.storage import Storage

with Diagram("LangChain-Powered Prompt Validation Architecture (GCP + OnPrem)", direction="LR", show=False, filename="langchain_prompt_architecture_colored"):
    # 👤 User
    user = Person("Data Engineer", "Uses DQ Observability App")

    # 🧱 System boundary for the App
    with SystemBoundary("DQ Observability App"):
        config_loader = Container(
            "PromptGenerator",
            "LangChain + Python",
            "Loads Prompts.json, DQ_Metrics.json"
        )

        langchain_prompt = Container(
            "LangChain Templates",
            "ChatPromptTemplate",
            "Builds structured prompts"
        )

        llm_executor = Container(
            "LLM Executor",
            "Prompt Handler",
            "Executes prompt & calls model"
        )

        dq_result = Container(
            "DQ Result",
            "JSON Output",
            "Severity, Fixes, Suggestions"
        )

    # 🔗 External GCP + OnPrem services
    llm_model = Mlflow("LLM Model\n(DeepSeek/Mistral - Local)")
    vertex_ai = AIPlatform("Vertex AI\n(Alt: Cloud Hosted LLM)")
    gcs = Storage("GCS\n(Configs + Uploads)")
    bigquery = Bigquery("BigQuery\n(DQ Metrics)")
    looker = Looker("Looker\n(DQ Dashboards)")
    dq_processor = Dbt("DQ Processor")
    cloud_run = Run("Streamlit App\n(Cloud Run)")
    scheduler = Scheduler("Cloud Scheduler\n(Orchestration)")

    # 🔁 Flow connections
    user >> Relationship("Triggers") >> config_loader
    config_loader >> Relationship("Maps Templates") >> langchain_prompt
    langchain_prompt >> Relationship("Injects Rules") >> llm_executor
    llm_executor >> Relationship("Executes Locally") >> llm_model
    llm_executor >> Relationship("Executes via API") >> vertex_ai
    llm_model >> Relationship("Fetched From") >> gcs
    llm_executor >> Relationship("Returns") >> dq_result
    dq_result >> Relationship("Displays") >> user
    dq_result >> Relationship("Used By") >> dq_processor
    dq_result >> Relationship("Stored In") >> bigquery
    bigquery >> Relationship("Feeds") >> looker
    cloud_run >> Relationship("Hosts UI") >> config_loader
    scheduler >> Relationship("Schedules") >> dq_processor
