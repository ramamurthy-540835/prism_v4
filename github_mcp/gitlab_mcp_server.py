#!/usr/bin/env python3
"""
GitLab MCP Server for Code Generation and Git Operations
Implements Model Context Protocol for GitLab integration with AI code generation
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from urllib.parse import urlparse

import requests
from mcp import types
from mcp.server import Server
from mcp.server.stdio import stdio_server
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gitlab-mcp")

# Configuration from environment
GITLAB_URL = os.getenv("GITLAB_URL", "https://gitlab.com")
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")
GITLAB_PROJECT_ID = os.getenv("GITLAB_PROJECT_ID")

class GitLabAPI:
    """GitLab API client for MCP operations"""
    
    def __init__(self, url: str, token: str):
        self.base_url = url.rstrip('/')
        self.token = token
        self.headers = {
            "PRIVATE-TOKEN": token,
            "Content-Type": "application/json"
        }
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make authenticated request to GitLab API"""
        url = f"{self.base_url}/api/v4/{endpoint.lstrip('/')}"
        
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()
            return response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            logger.error(f"GitLab API error: {e}")
            raise Exception(f"GitLab API request failed: {e}")
    
    def test_connection(self) -> bool:
        """Test GitLab connection"""
        try:
            self._make_request("GET", "/user")
            return True
        except:
            return False
    
    def get_project_info(self, project_id: str) -> Dict[str, Any]:
        """Get project information"""
        return self._make_request("GET", f"/projects/{project_id}")
    
    def list_repository_tree(self, project_id: str, path: str = "", ref: str = "main") -> List[Dict]:
        """List repository files and directories"""
        params = {"path": path, "ref": ref, "recursive": False}
        return self._make_request("GET", f"/projects/{project_id}/repository/tree", params=params)
    
    def get_file_content(self, project_id: str, file_path: str, ref: str = "main") -> str:
        """Get file content from repository"""
        try:
            response = self._make_request("GET", f"/projects/{project_id}/repository/files/{file_path.replace('/', '%2F')}", 
                                        params={"ref": ref})
            import base64
            return base64.b64decode(response["content"]).decode('utf-8')
        except Exception as e:
            logger.error(f"Error getting file content: {e}")
            return ""
    
    def create_or_update_file(self, project_id: str, file_path: str, content: str, 
                            commit_message: str, branch: str = "main", 
                            author_email: str = None, author_name: str = None) -> Dict[str, Any]:
        """Create or update file in repository"""
        import base64
        
        data = {
            "branch": branch,
            "content": base64.b64encode(content.encode('utf-8')).decode('ascii'),
            "commit_message": commit_message,
            "encoding": "base64"
        }
        
        if author_email:
            data["author_email"] = author_email
        if author_name:
            data["author_name"] = author_name
        
        # Try to get existing file first
        try:
            self.get_file_content(project_id, file_path, branch)
            # File exists, update it
            return self._make_request("PUT", f"/projects/{project_id}/repository/files/{file_path.replace('/', '%2F')}", 
                                    json=data)
        except:
            # File doesn't exist, create it
            return self._make_request("POST", f"/projects/{project_id}/repository/files/{file_path.replace('/', '%2F')}", 
                                    json=data)
    
    def generate_code_with_suggestions(self, file_name: str, user_instruction: str, 
                                     context: str = "") -> str:
        """Generate code using GitLab Code Suggestions API"""
        data = {
            "current_file": {
                "file_name": file_name,
                "content_above_cursor": context,
                "content_below_cursor": ""
            },
            "intent": "generation",
            "user_instruction": user_instruction
        }
        
        if context:
            data["context"] = [
                {
                    "type": "snippet",
                    "name": "context",
                    "content": context
                }
            ]
        
        try:
            response = self._make_request("POST", "/code_suggestions/completions", json=data)
            return response.get("choices", [{}])[0].get("text", "")
        except Exception as e:
            logger.error(f"Code generation failed: {e}")
            # Fallback: generate basic SQL structure
            if "sql" in file_name.lower():
                return self._generate_fallback_sql(user_instruction)
            return f"-- Generated code for: {user_instruction}\n-- Please implement manually"
    
    def _generate_fallback_sql(self, instruction: str) -> str:
        """Generate basic SQL when API fails"""
        instruction_lower = instruction.lower()
        
        if "select" in instruction_lower and "from" in instruction_lower:
            return f"-- {instruction}\nSELECT * FROM table_name WHERE condition = 'value';"
        elif "insert" in instruction_lower:
            return f"-- {instruction}\nINSERT INTO table_name (column1, column2) VALUES (value1, value2);"
        elif "update" in instruction_lower:
            return f"-- {instruction}\nUPDATE table_name SET column1 = value1 WHERE condition = 'value';"
        elif "delete" in instruction_lower:
            return f"-- {instruction}\nDELETE FROM table_name WHERE condition = 'value';"
        else:
            return f"-- {instruction}\n-- TODO: Implement SQL query"

class GitLabMCPServer:
    """MCP Server for GitLab integration"""
    
    def __init__(self):
        self.server = Server("gitlab-mcp")
        self.gitlab = None
        
        if GITLAB_TOKEN:
            self.gitlab = GitLabAPI(GITLAB_URL, GITLAB_TOKEN)
        
        self._register_tools()
        self._register_resources()
    
    def _register_tools(self):
        """Register MCP tools"""
        
        @self.server.list_tools()
        async def list_tools() -> List[types.Tool]:
            return [
                types.Tool(
                    name="test_gitlab_connection",
                    description="Test connection to GitLab instance",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                types.Tool(
                    name="list_project_files",
                    description="List files in GitLab project repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "project_id": {"type": "string", "description": "GitLab project ID"},
                            "path": {"type": "string", "description": "Repository path (optional)", "default": ""},
                            "branch": {"type": "string", "description": "Branch name", "default": "main"}
                        },
                        "required": ["project_id"]
                    }
                ),
                types.Tool(
                    name="get_file_content",
                    description="Get content of a file from GitLab repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "project_id": {"type": "string", "description": "GitLab project ID"},
                            "file_path": {"type": "string", "description": "Path to file in repository"},
                            "branch": {"type": "string", "description": "Branch name", "default": "main"}
                        },
                        "required": ["project_id", "file_path"]
                    }
                ),
                types.Tool(
                    name="generate_sql_code",
                    description="Generate SQL code from natural language using GitLab Code Suggestions",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "instruction": {"type": "string", "description": "Natural language instruction for SQL generation"},
                            "context": {"type": "string", "description": "Additional context (table schemas, etc.)", "default": ""},
                            "file_name": {"type": "string", "description": "Target SQL file name", "default": "query.sql"}
                        },
                        "required": ["instruction"]
                    }
                ),
                types.Tool(
                    name="commit_generated_code",
                    description="Commit generated code to GitLab repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "project_id": {"type": "string", "description": "GitLab project ID"},
                            "file_path": {"type": "string", "description": "Path where to save the file"},
                            "content": {"type": "string", "description": "File content to commit"},
                            "commit_message": {"type": "string", "description": "Commit message"},
                            "branch": {"type": "string", "description": "Target branch", "default": "main"},
                            "author_name": {"type": "string", "description": "Author name (optional)"},
                            "author_email": {"type": "string", "description": "Author email (optional)"}
                        },
                        "required": ["project_id", "file_path", "content", "commit_message"]
                    }
                ),
                types.Tool(
                    name="translate_rules_to_sql",
                    description="Translate data quality rules to SQL using integrated DQ system",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "rules_csv_content": {"type": "string", "description": "CSV content with column_name,rules"},
                            "data_context": {"type": "string", "description": "Sample data for context (optional)", "default": ""}
                        },
                        "required": ["rules_csv_content"]
                    }
                ),
                types.Tool(
                    name="create_branch",
                    description="Create a new branch in GitLab repository",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "project_id": {"type": "string", "description": "GitLab project ID"},
                            "branch_name": {"type": "string", "description": "New branch name"},
                            "ref": {"type": "string", "description": "Source branch/commit", "default": "main"}
                        },
                        "required": ["project_id", "branch_name"]
                    }
                ),
                types.Tool(
                    name="create_merge_request",
                    description="Create merge request for generated code",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "project_id": {"type": "string", "description": "GitLab project ID"},
                            "source_branch": {"type": "string", "description": "Source branch"},
                            "target_branch": {"type": "string", "description": "Target branch", "default": "main"},
                            "title": {"type": "string", "description": "MR title"},
                            "description": {"type": "string", "description": "MR description", "default": ""}
                        },
                        "required": ["project_id", "source_branch", "title"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
            if not self.gitlab:
                return [types.TextContent(type="text", text="Error: GitLab token not configured")]
            
            try:
                if name == "test_gitlab_connection":
                    result = self.gitlab.test_connection()
                    return [types.TextContent(type="text", 
                                            text=f"GitLab connection: {'✅ Success' if result else '❌ Failed'}")]
                
                elif name == "list_project_files":
                    project_id = arguments["project_id"]
                    path = arguments.get("path", "")
                    branch = arguments.get("branch", "main")
                    
                    files = self.gitlab.list_repository_tree(project_id, path, branch)
                    file_list = "\n".join([f"{'📁' if f['type'] == 'tree' else '📄'} {f['name']}" for f in files])
                    
                    return [types.TextContent(type="text", 
                                            text=f"Files in {project_id}:{path or '/'}:\n{file_list}")]
                
                elif name == "get_file_content":
                    project_id = arguments["project_id"]
                    file_path = arguments["file_path"]
                    branch = arguments.get("branch", "main")
                    
                    content = self.gitlab.get_file_content(project_id, file_path, branch)
                    return [types.TextContent(type="text", 
                                            text=f"Content of {file_path}:\n```\n{content}\n```")]
                
                elif name == "generate_sql_code":
                    instruction = arguments["instruction"]
                    context = arguments.get("context", "")
                    file_name = arguments.get("file_name", "query.sql")
                    
                    generated_code = self.gitlab.generate_code_with_suggestions(file_name, instruction, context)
                    
                    return [types.TextContent(type="text", 
                                            text=f"Generated SQL for '{instruction}':\n```sql\n{generated_code}\n```")]
                
                elif name == "commit_generated_code":
                    project_id = arguments["project_id"]
                    file_path = arguments["file_path"]
                    content = arguments["content"]
                    commit_message = arguments["commit_message"]
                    branch = arguments.get("branch", "main")
                    author_name = arguments.get("author_name")
                    author_email = arguments.get("author_email")
                    
                    result = self.gitlab.create_or_update_file(
                        project_id, file_path, content, commit_message, 
                        branch, author_email, author_name
                    )
                    
                    return [types.TextContent(type="text", 
                                            text=f"✅ File committed successfully!\nCommit: {result.get('commit_id', 'unknown')}")]
                
                elif name == "translate_rules_to_sql":
                    return await self._translate_rules_to_sql(arguments)
                
                elif name == "create_branch":
                    project_id = arguments["project_id"]
                    branch_name = arguments["branch_name"]
                    ref = arguments.get("ref", "main")
                    
                    data = {"branch": branch_name, "ref": ref}
                    result = self.gitlab._make_request("POST", f"/projects/{project_id}/repository/branches", json=data)
                    
                    return [types.TextContent(type="text", 
                                            text=f"✅ Branch '{branch_name}' created from '{ref}'")]
                
                elif name == "create_merge_request":
                    project_id = arguments["project_id"]
                    source_branch = arguments["source_branch"]
                    target_branch = arguments.get("target_branch", "main")
                    title = arguments["title"]
                    description = arguments.get("description", "")
                    
                    data = {
                        "source_branch": source_branch,
                        "target_branch": target_branch,
                        "title": title,
                        "description": description
                    }
                    
                    result = self.gitlab._make_request("POST", f"/projects/{project_id}/merge_requests", json=data)
                    
                    return [types.TextContent(type="text", 
                                            text=f"✅ Merge Request created: {result.get('web_url', 'Success')}")]
                
                else:
                    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]
                    
            except Exception as e:
                logger.error(f"Tool {name} failed: {e}")
                return [types.TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _translate_rules_to_sql(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Translate data quality rules to SQL"""
        import csv
        import io
        
        rules_csv = arguments["rules_csv_content"]
        data_context = arguments.get("data_context", "")
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(rules_csv))
        results = []
        
        for row in reader:
            column = row.get('column_name', '').strip()
            rule = row.get('rules', '').strip()
            
            if not column or not rule:
                continue
            
            # Generate SQL using GitLab Code Suggestions
            instruction = f"Generate SQL WHERE condition for column '{column}' with rule: {rule}"
            context = f"Column: {column}\nRule: {rule}\n{data_context}"
            
            try:
                sql_condition = self.gitlab.generate_code_with_suggestions("validation.sql", instruction, context)
                results.append(f"-- {column}: {rule}\n{sql_condition}")
            except Exception as e:
                results.append(f"-- {column}: {rule}\n-- Error: {e}\n{column} IS NOT NULL")
        
        combined_sql = "\n\n".join(results)
        
        return [types.TextContent(type="text", 
                                text=f"Translated Rules to SQL:\n```sql\n{combined_sql}\n```")]
    
    def _register_resources(self):
        """Register MCP resources"""
        
        @self.server.list_resources()
        async def list_resources() -> List[types.Resource]:
            return [
                types.Resource(
                    uri="gitlab://config",
                    name="GitLab Configuration",
                    description="Current GitLab MCP configuration",
                    mimeType="application/json"
                ),
                types.Resource(
                    uri="gitlab://projects",
                    name="GitLab Projects",
                    description="List of accessible GitLab projects",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            if uri == "gitlab://config":
                config = {
                    "gitlab_url": GITLAB_URL,
                    "token_configured": bool(GITLAB_TOKEN),
                    "default_project_id": GITLAB_PROJECT_ID,
                    "connection_status": self.gitlab.test_connection() if self.gitlab else False
                }
                return json.dumps(config, indent=2)
            
            elif uri == "gitlab://projects":
                if not self.gitlab:
                    return json.dumps({"error": "GitLab not configured"})
                
                try:
                    projects = self.gitlab._make_request("GET", "/projects?membership=true&per_page=20")
                    project_list = [{"id": p["id"], "name": p["name"], "path": p["path_with_namespace"]} 
                                  for p in projects]
                    return json.dumps(project_list, indent=2)
                except Exception as e:
                    return json.dumps({"error": str(e)})
            
            else:
                raise ValueError(f"Unknown resource: {uri}")

async def main():
    """Run the GitLab MCP server"""
    server_instance = GitLabMCPServer()
    
    async with stdio_server() as (read_stream, write_stream):
        await server_instance.server.run(
            read_stream,
            write_stream,
            server_instance.server.create_initialization_options()
        )

if __name__ == "__main__":
    logger.info("Starting GitLab MCP Server...")
    asyncio.run(main())