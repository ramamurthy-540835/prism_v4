
import streamlit as st
from diagrams import Diagram
from diagrams.gcp.compute import Run
from diagrams.gcp.ml import AIPlatform
from diagrams.gcp.storage import Storage
from diagrams.gcp.analytics import Bigquery, Dataflow
from diagrams.gcp.devtools import Scheduler, Build
from diagrams.onprem.analytics import Dbt
from diagrams.custom import Custom
from diagrams.gcp.security import Iam
from diagrams.gcp.database import SQL
from diagrams.c4 import Person, Container, SystemBoundary, Relationship
import graphviz
import os
import tempfile

class ArchitectureVisualizer:
    @staticmethod
    def generate_diagram():
        dot = graphviz.Digraph(comment='GCP Architecture', engine='dot')
        dot.attr(rankdir='LR', size='20,15')
        dot.node('user', '👤 Data Engineer\n(Uses UI)', shape='ellipse', style='filled', color='lightblue2')
        dot.node('streamlit', 'Streamlit App\n(Cloud Run)', shape='box', style='filled', color='lightsteelblue1')
        dot.node('gcs', 'GCS\n(Configs + Data)', shape='cylinder', style='filled', color='lightcyan1')
        dot.node('vertex', 'Vertex AI\n(LLM Execution)', shape='box3d', style='filled', color='plum1')
        dot.node('bigquery', 'BigQuery\n(DQ Results)', shape='cylinder', style='filled', color='thistle1')
        dot.node('chroma', 'ChromaDB\n(Vector Store)', shape='cylinder', style='filled', color='lightpink')
        dot.node('looker', 'Looker\n(Dashboards)', shape='box', style='filled', color='peachpuff')
        dot.node('dataflow', 'Dataflow\n(Validation)', shape='box3d', style='filled', color='lightgoldenrod1')
        dot.edge('user', 'streamlit', label='Upload/Query', color='blue')
        dot.edge('streamlit', 'gcs', label='Store Configs', color='darkgreen')
        dot.edge('streamlit', 'vertex', label='LLM Requests', color='purple')
        dot.edge('vertex', 'bigquery', label='Store Results', color='red')
        dot.edge('bigquery', 'looker', label='Visualize', color='orange')
        dot.edge('streamlit', 'chroma', label='Vector Embeddings', color='deeppink')
        dot.edge('chroma', 'streamlit', label='Semantic Search', color='deeppink3')
        dot.edge('bigquery', 'dataflow', label='Trigger Jobs', color='darkgoldenrod')
        return dot

class DiagramGenerator:
    @staticmethod
    def generate_and_save_diagram():
        temp_dir = tempfile.mkdtemp()
        diagram_path = os.path.join(temp_dir, "gcp_dq_architecture")
        with Diagram("🧠 GenAI-Powered DQ Validation – GCP Technical Architecture",
                     direction="LR", show=False, filename=diagram_path, outformat="png"):
            user = Person("Data Engineer", "Uses UI")
            with SystemBoundary("DQ Observability App on GCP"):
                streamlit_ui = Container("Streamlit App", "Cloud Run", "UI to upload & validate CSV")
                config_loader = Container("PromptEngine", "LangChain + GCS", "Loads JSON config & prompt templates")
                llm_executor = Container("LLM Executor", "Prompt Handler", "Builds prompt and routes to model")
                dq_result = Container("DQ Result Store", "BigQuery", "Stores validation results")
            gcs = Storage("GCS (Data Uploads + Configs)")
            vertex_ai = AIPlatform("Vertex AI (LLM API Execution)")
            chroma_sql = SQL("ChromaDB (SQL mode)")
            bigquery = Bigquery("BigQuery (DQ Score Storage)")
            looker = Custom("Looker (Dashboard)", "./gcplooker.png")
            dq_processor = Dbt("DBT Cloud (Transform/Validate)")
            scheduler = Scheduler("Cloud Scheduler (Periodic Jobs)")
            pipeline = Dataflow("Dataflow (Automated Validation)")
            cicd = Build("Cloud Build (CI/CD)")
            security = Iam("IAM (Service Auth)")
            user >> Relationship("Access UI") >> streamlit_ui
            streamlit_ui >> Relationship("Load Configs") >> gcs
            streamlit_ui >> Relationship("Generate Prompts") >> config_loader
            config_loader >> Relationship("Invoke LLM") >> vertex_ai
            vertex_ai >> Relationship("Return Answers") >> llm_executor
            llm_executor >> Relationship("Push to DQ Store") >> dq_result
            dq_result >> Relationship("Used By") >> bigquery >> looker
            bigquery >> Relationship("Queried By") >> dq_processor
            scheduler >> Relationship("Triggers") >> pipeline
            cicd >> Relationship("Deploys") >> streamlit_ui
            streamlit_ui >> Relationship("Logs/Access") >> security
            dq_result >> Relationship("Vector Embedding") >> chroma_sql
        return f"{diagram_path}.png"

def main():
    st.set_page_config(layout="wide")
    st.title("🏗️ GenAI-Powered DQ Architecture Viewer")

    with st.expander("📌 Interactive Graphviz View", expanded=True):
        st.graphviz_chart(ArchitectureVisualizer.generate_diagram().source)

    with st.expander("📸 Generate and Download PNG"):
        if st.button("Generate PNG Diagram"):
            with st.spinner("Generating..."):
                try:
                    path = DiagramGenerator.generate_and_save_diagram()
                    st.image(path, caption="GCP Architecture (PNG)", use_column_width=True)
                    with open(path, "rb") as file:
                        st.download_button("Download PNG", data=file, file_name="gcp_dq_architecture.png", mime="image/png")
                except Exception as e:
                    st.error(str(e))

if __name__ == "__main__":
    main()
