#!/usr/bin/env python3
"""
Start GitLab MCP Server Script using 'workon' for virtual environment activation.
"""

import os
import subprocess
from pathlib import Path

def print_status(message):
    print(f"\033[0;32m[INFO]\033[0m {message}")

def print_error(message):
    print(f"\033[0;31m[ERROR]\033[0m {message}")

def start_server(env_name, server_script):
    """Start the MCP server using 'workon' to activate the environment."""
    print_status(f"Activating virtual environment: {env_name}")
    
    # Check if virtualenvwrapper's workon command is available
    if not subprocess.run(["command", "-v", "workon"], shell=True, stdout=subprocess.PIPE).returncode == 0:
        print_error("The 'workon' command is not available. Please ensure virtualenvwrapper is installed and configured.")
        return

    # Run the server script
    try:
        subprocess.run(f"workon {env_name} && python {server_script}", shell=True, check=True)
        print_status("GitLab MCP Server is running.")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to start the MCP server. Error: {e}")

def main():
    print_status("Initializing the MCP Server Starter...")

    # Define environment name and server script path
    env_name = "genai_env"  # Replace with your virtual environment name
    project_path = Path("gitlab-mcp")
    server_script = project_path / "gitlab_mcp_server.py"

    # Check if the server script exists
    if not server_script.exists():
        print_error(f"Server script not found at {server_script}. Please ensure the setup is complete.")
        return

    # Start the server
    start_server(env_name, server_script)

if __name__ == "__main__":
    main()
