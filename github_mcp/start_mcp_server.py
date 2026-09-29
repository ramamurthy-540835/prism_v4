#!/usr/bin/env python3
"""
GitLab MCP Server Setup Script
Replicates the functionality of the Bash script in Python
"""

import os
import subprocess
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# ANSI colors for console output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    RESET = '\033[0m'

def print_status(message):
    print(f"{Colors.GREEN}[INFO]{Colors.RESET} {message}")

def print_warning(message):
    print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} {message}")

def print_error(message):
    print(f"{Colors.RED}[ERROR]{Colors.RESET} {message}")

def print_step(message):
    print(f"\n{Colors.BLUE}[STEP]{Colors.RESET} {message}")

# Ensure Python version is 3.8 or higher
def check_python_version():
    print_step("Checking Python version...")
    if sys.version_info < (3, 8):
        print_error(f"Python 3.8+ required, found {sys.version}")
        sys.exit(1)
    print_status(f"Python {sys.version.split()[0]} is compatible ✓")

# Create project directory structure
def create_project_structure():
    print_step("Creating project structure...")
    project_dir = Path("gitlab-mcp")
    if project_dir.exists():
        print_warning(f"Directory {project_dir} already exists.")
    else:
        project_dir.mkdir(parents=True)
        (project_dir / "logs").mkdir()
        (project_dir / "templates").mkdir()
        (project_dir / "examples").mkdir()
        (project_dir / "sql").mkdir()
        (project_dir / "queries").mkdir()
        print_status(f"Project structure created at {project_dir} ✓")

# Set up a virtual environment
def setup_virtual_env():
    print_step("Setting up virtual environment...")
    venv_dir = Path("gitlab-mcp/venv")
    if not venv_dir.exists():
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)])
        print_status("Virtual environment created ✓")
    else:
        print_status("Virtual environment already exists ✓")

    # Activate and upgrade pip
    activate_script = venv_dir / ("Scripts/activate" if os.name == "nt" else "bin/activate")
    subprocess.run([str(activate_script), "&&", "pip", "install", "--upgrade", "pip"], shell=True)
    print_status("Virtual environment activated and pip upgraded ✓")

# Install required dependencies
def install_dependencies():
    print_step("Installing dependencies...")
    dependencies = [
        "mcp==1.0.0",
        "pydantic>=2.0.0",
        "requests>=2.31.0",
        "python-dotenv>=1.0.0",
        "pandas>=2.0.0",
        "jinja2>=3.1.0",
        "google-generativeai>=0.3.0",
        "streamlit>=1.28.0",
    ]
    subprocess.run([sys.executable, "-m", "pip", "install", *dependencies], check=True)
    print_status("Dependencies installed ✓")

# Create .env configuration file
def create_env_config():
    print_step("Creating .env configuration...")
    env_path = Path("gitlab-mcp/.env")
    if not env_path.exists():
        gitlab_url = input("GitLab URL (default: https://gitlab.com): ") or "https://gitlab.com"
        gitlab_token = input("GitLab Personal Access Token: ").strip()
        gitlab_project_id = input("GitLab Project ID (or leave blank): ").strip() or "your_project_id_here"
        gemini_api_key = input("Gemini API Key (optional): ").strip() or "your_gemini_api_key_here"

        with open(env_path, "w") as env_file:
            env_file.write(f"""# GitLab Configuration
GITLAB_URL={gitlab_url}
GITLAB_TOKEN={gitlab_token}
GITLAB_PROJECT_ID={gitlab_project_id}

# Fallback LLM
GEMINI_API_KEY={gemini_api_key}
""")
        print_status(".env configuration file created ✓")
    else:
        print_status(".env file already exists ✓")

# Test GitLab connection
def test_gitlab_connection():
    print_step("Testing GitLab connection...")
    load_dotenv(dotenv_path=Path("gitlab-mcp/.env"))
    gitlab_url = os.getenv("GITLAB_URL")
    gitlab_token = os.getenv("GITLAB_TOKEN")

    response = subprocess.run(
        [
            "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
            "--header", f"PRIVATE-TOKEN: {gitlab_token}",
            f"{gitlab_url}/api/v4/user"
        ],
        capture_output=True,
        text=True,
    )
    if response.stdout.strip() == "200":
        print_status("GitLab connection successful ✓")
    else:
        print_error("GitLab connection failed. Please check your .env configuration.")
        sys.exit(1)

# Main execution
if __name__ == "__main__":
    print("🚀 GitLab MCP Server Setup")
    print("==========================")
    check_python_version()
    create_project_structure()
    setup_virtual_env()
    install_dependencies()
    create_env_config()
    test_gitlab_connection()
    print("\n🎉 GitLab MCP Server setup completed successfully!")
