#!/usr/bin/env python3
"""
Complete Multi-Language Code Generation App with Advanced MCP Integration
- Supports: Python, Java, Next.js, SQL, BigQuery, Snowflake, Go, Rust, C#, Kotlin, Scala
- Code enhancement and fixing via MCP
- Real Google Drive integration
- Human language processing
"""

import streamlit as st
import asyncio
import pandas as pd
import os
import json
import requests
from datetime import datetime
import sys
from pathlib import Path
import io
import zipfile
import ssl
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

# Import our translator
try:
    from debug_deepseek_response_jinja4 import DeepSeekTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False

# Load environment variables and config
from dotenv import load_dotenv
load_dotenv()

# Real Google Drive integration with SSL fix
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    from googleapiclient.errors import HttpError
    import httplib2
    GOOGLE_APIS_AVAILABLE = True
except ImportError:
    GOOGLE_APIS_AVAILABLE = False

# Extended language configuration
EXTENDED_LANGUAGE_CONFIG = {
    "languages": {
        "python": {"enabled": True, "framework": "fastapi", "icon": "🐍", "category": "Backend"},
        "java": {"enabled": True, "framework": "spring_boot", "icon": "☕", "category": "Backend"},
        "nextjs": {"enabled": True, "framework": "nextjs", "icon": "⚛️", "category": "Frontend"},
        "sql": {"enabled": True, "framework": "postgresql", "icon": "🗄️", "category": "Database"},
        "bigquery": {"enabled": True, "framework": "bigquery", "icon": "📊", "category": "Analytics"},
        "snowflake": {"enabled": True, "framework": "snowflake", "icon": "❄️", "category": "Analytics"},
        "go": {"enabled": True, "framework": "gin", "icon": "🔵", "category": "Backend"},
        "rust": {"enabled": True, "framework": "actix", "icon": "🦀", "category": "Systems"},
        "csharp": {"enabled": True, "framework": "dotnet", "icon": "#️⃣", "category": "Backend"},
        "kotlin": {"enabled": False, "framework": "spring", "icon": "🟣", "category": "Backend"},
        "scala": {"enabled": False, "framework": "play", "icon": "🔴", "category": "Backend"}
    }
}

# Page config
st.set_page_config(
    page_title="Advanced Multi-Language Code Generator",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Enhanced CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        color: #2E86AB;
        text-align: center;
        margin-bottom: 2rem;
        background: linear-gradient(45deg, #2E86AB, #A23B72);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .success-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    .error-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    .drive-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #e8f5e8;
        border: 2px solid #4285f4;
        color: #1a73e8;
    }
    .mcp-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
    }
    .language-category {
        padding: 0.5rem;
        margin: 0.2rem;
        border-radius: 0.3rem;
        font-size: 0.9rem;
    }
    .backend { background-color: #e3f2fd; color: #1976d2; }
    .frontend { background-color: #f3e5f5; color: #7b1fa2; }
    .database { background-color: #e8f5e9; color: #388e3c; }
    .analytics { background-color: #fff3e0; color: #f57c00; }
    .systems { background-color: #fce4ec; color: #c2185b; }
    .enhancement-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background: linear-gradient(45deg, #ff6b6b, #ee5a24);
        color: white;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class GoogleDriveManager:
    """Enhanced Google Drive manager with SSL fix"""

    def __init__(self):
        self.credentials_path = os.getenv('GOOGLE_DRIVE_CREDENTIALS', 'credentials/google_drive_credentials.json')
        self.folder_id = os.getenv('GOOGLE_DRIVE_FOLDER_ID', '13ndB996J82iIR2ZGCi6_Y4XlPowMNG45')
        self.service = None
        self.connected = False

        if GOOGLE_APIS_AVAILABLE:
            self._initialize_service()

    def _initialize_service(self):
        """Initialize Google Drive service with SSL configuration"""
        try:
            if not os.path.exists(self.credentials_path):
                return

            scopes = [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata.readonly'
            ]

            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path, scopes=scopes
            )

            http = httplib2.Http()
            http.disable_ssl_certificate_validation = True
            
            self.service = build('drive', 'v3', credentials=credentials, http=http)
            folder_info = self.service.files().get(fileId=self.folder_id).execute()
            self.connected = True

        except Exception as e:
            self.connected = False

    def check_connection(self):
        """Check Google Drive connection"""
        if not GOOGLE_APIS_AVAILABLE:
            return False, "Google API libraries not installed"

        if not self.connected:
            return False, "Connection failed - check credentials"

        try:
            folder_info = self.service.files().get(fileId=self.folder_id).execute()
            return True, f"Connected to: {folder_info.get('name', 'Code Generator Output')}"
        except Exception as e:
            return False, f"Error: {str(e)}"

    def upload_file(self, filename, content):
        """Upload file to Google Drive"""
        if not self.connected:
            return False, "Not connected to Google Drive"

        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            timestamped_filename = f"{timestamp}_{filename}"

            file_metadata = {
                'name': timestamped_filename,
                'parents': [self.folder_id]
            }

            media = MediaIoBaseUpload(
                io.BytesIO(content.encode('utf-8')),
                mimetype='text/plain',
                resumable=True
            )

            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,name,webViewLink'
            ).execute()

            return True, f"✅ Uploaded: {file.get('name')}"

        except Exception as e:
            return False, f"Upload failed: {str(e)}"

    def upload_multiple_files(self, files):
        """Upload multiple files"""
        success_count = 0
        messages = []

        for filename, content in files.items():
            success, message = self.upload_file(filename, content)
            if success:
                success_count += 1
            messages.append(message)

        return success_count, len(files), messages

# Initialize global Drive manager
@st.cache_resource
def get_drive_manager():
    return GoogleDriveManager()

def check_services():
    """Check all service connections"""
    services = {}

    # GitHub
    github_token = os.getenv('GITHUB_TOKEN', '')
    if github_token:
        try:
            response = requests.get("https://api.github.com/user",
                                  headers={'Authorization': f'Bearer {github_token}'}, timeout=5)
            services['github'] = response.status_code == 200
        except:
            services['github'] = False
    else:
        services['github'] = False

    # Google Drive
    try:
        drive_manager = get_drive_manager()
        connected, message = drive_manager.check_connection()
        services['google_drive'] = connected
        services['google_drive_message'] = message
    except Exception as e:
        services['google_drive'] = False
        services['google_drive_message'] = f"Error: {str(e)}"

    # Enhanced MCP Server
    try:
        mcp_host = os.getenv('MCP_SERVER_HOST', 'localhost')
        mcp_port = os.getenv('MCP_SERVER_PORT', '8000')
        response = requests.get(f"http://{mcp_host}:{mcp_port}/health", timeout=2)
        if response.status_code == 200:
            services['mcp'] = True
            health_data = response.json()
            services['mcp_message'] = "Advanced MCP Server Connected"
            services['mcp_capabilities'] = health_data.get('capabilities', {})
        else:
            services['mcp'] = False
            services['mcp_message'] = f"HTTP {response.status_code}"
    except Exception as e:
        services['mcp'] = False
        services['mcp_message'] = f"Connection failed: {str(e)}"

    # DeepSeek
    try:
        endpoints = os.getenv('LLM_ENDPOINTS', 'http://llm-loadbalancer.local:80/v1/chat/completions').split(',')
        response = requests.post(endpoints[0].strip(),
                               json={"model": "deepseek-coder", "messages": [{"role": "user", "content": "test"}], "max_tokens": 5},
                               timeout=5)
        services['deepseek'] = response.status_code == 200
    except:
        services['deepseek'] = False

    return services

def get_supported_languages():
    """Get supported languages from MCP server"""
    try:
        mcp_host = os.getenv('MCP_SERVER_HOST', 'localhost')
        mcp_port = os.getenv('MCP_SERVER_PORT', '8000')
        response = requests.get(f"http://{mcp_host}:{mcp_port}/languages", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            return EXTENDED_LANGUAGE_CONFIG["languages"]
    except:
        return EXTENDED_LANGUAGE_CONFIG["languages"]

def process_human_language(human_input, target_languages):
    """Process human language input via enhanced MCP server"""
    mcp_host = os.getenv('MCP_SERVER_HOST', 'localhost')
    mcp_port = os.getenv('MCP_SERVER_PORT', '8000')
    
    try:
        payload = {
            "human_input": human_input,
            "target_languages": target_languages
        }
        
        response = requests.post(
            f"http://{mcp_host}:{mcp_port}/generate-code",
            json=payload,
            timeout=20
        )
        
        if response.status_code == 200:
            result = response.json()
            return True, result
        else:
            return False, f"MCP server error: HTTP {response.status_code}"
            
    except Exception as e:
        return False, f"MCP connection error: {str(e)}"

def enhance_existing_code(code, language, enhancement_type):
    """Enhance existing code via MCP server"""
    mcp_host = os.getenv('MCP_SERVER_HOST', 'localhost')
    mcp_port = os.getenv('MCP_SERVER_PORT', '8000')
    
    try:
        payload = {
            "code": code,
            "language": language,
            "enhancement_type": enhancement_type
        }
        
        response = requests.post(
            f"http://{mcp_host}:{mcp_port}/enhance-code",
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            return True, result
        else:
            return False, f"Enhancement failed: HTTP {response.status_code}"
            
    except Exception as e:
        return False, f"Enhancement error: {str(e)}"

def analyze_code(code, language):
    """Analyze code quality via MCP server"""
    mcp_host = os.getenv('MCP_SERVER_HOST', 'localhost')
    mcp_port = os.getenv('MCP_SERVER_PORT', '8000')
    
    try:
        payload = {
            "code": code,
            "language": language
        }
        
        response = requests.post(
            f"http://{mcp_host}:{mcp_port}/analyze-code",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            return True, result
        else:
            return False, f"Analysis failed: HTTP {response.status_code}"
            
    except Exception as e:
        return False, f"Analysis error: {str(e)}"

def save_to_google_drive(filename, content):
    """Save to Google Drive"""
    drive_manager = get_drive_manager()
    return drive_manager.upload_file(filename, content)

def save_multiple_to_google_drive(files):
    """Save multiple files to Google Drive"""
    drive_manager = get_drive_manager()
    return drive_manager.upload_multiple_files(files)

def main():
    # Header
    st.markdown('<h1 class="main-header">🚀 Advanced Multi-Language Code Generator</h1>', unsafe_allow_html=True)

    # Sidebar
    st.sidebar.header("🔧 Configuration")

    # Service status
    st.sidebar.subheader("Service Status")
    services = check_services()

    # Display service status
    for service, status in services.items():
        if service.endswith('_message') or service.endswith('_capabilities'):
            continue

        icon = "✅" if status else "❌"
        color = "success-box" if status else "error-box"

        if service == 'google_drive':
            message = services.get('google_drive_message', 'Unknown status')
            st.sidebar.markdown(f'<div class="{color}">{icon} Google Drive<br><small>{message}</small></div>', unsafe_allow_html=True)
        elif service == 'mcp':
            message = services.get('mcp_message', 'Unknown status')
            capabilities = services.get('mcp_capabilities', {})
            supported_langs = len(capabilities.get('supported_languages', []))
            st.sidebar.markdown(f'<div class="{color}">{icon} MCP Server<br><small>{message}<br>Languages: {supported_langs}</small></div>', unsafe_allow_html=True)
        else:
            st.sidebar.markdown(f'<div class="{color}">{icon} {service.replace("_", " ").title()}</div>', unsafe_allow_html=True)

    # Enhanced Language selection
    st.sidebar.subheader("Target Languages")
    
    # Get supported languages from MCP server
    supported_languages = get_supported_languages()
    
    # Group languages by category
    categories = {}
    for lang, config in supported_languages.items():
        category = config.get('category', 'Other')
        if category not in categories:
            categories[category] = []
        categories[category].append((lang, config))
    
    enabled_languages = []
    
    for category, langs in categories.items():
        st.sidebar.markdown(f"**{category}**")
        for lang, config in langs:
            icon = config.get('icon', '🔧')
            framework = config.get('framework', 'standard')
            
            if st.sidebar.checkbox(
                f"{icon} {lang.title()} ({framework})", 
                value=config.get("enabled", False), 
                key=f"lang_{lang}"
            ):
                enabled_languages.append(lang)
    
    # Show total selected
    if enabled_languages:
        st.sidebar.success(f"Selected: {len(enabled_languages)} languages")

    # Main content with tabs
    tab1, tab2, tab3 = st.tabs(["🚀 Code Generation", "⚡ Code Enhancement", "📊 Batch Processing"])
    
    with tab1:
    # Code Generation Tab
        col1, col2 = st.columns([1, 1])
    
        with col1:
            st.header("🗣️ Human Language to Code")
            
            # Initialize default value in session state if not exists
            if 'human_input_value' not in st.session_state:
                st.session_state.human_input_value = "Email addresses should be valid and not contain noreply"

            # Enhanced human language input
            human_input = st.text_area(
                "Describe your validation requirement:",
                value=st.session_state.human_input_value,
                help="Examples: 'BigQuery: Check if user_id exists in users table', 'Snowflake: Validate JSON schema for events', 'Go: Phone numbers with country codes'",
                height=100,
                key="human_input"
            )
            
            # Update the session state value when text area changes
            if human_input != st.session_state.human_input_value:
                st.session_state.human_input_value = human_input

            # Quick Examples
            st.markdown("**Quick Examples:**")
            example_col1, example_col2, example_col3 = st.columns(3)

            with example_col1:
                if st.button("📧 Email Example", key="email_example"):
                    st.session_state.human_input_value = "Email addresses should be valid and not contain noreply"
                    st.rerun()

            with example_col2:
                if st.button("📞 Phone Example", key="phone_example"):
                    st.session_state.human_input_value = "Phone numbers should have country codes and be properly formatted"
                    st.rerun()

            with example_col3:
                if st.button("🔢 ID Example", key="id_example"):
                    st.session_state.human_input_value = "User IDs must exist in the users table and be active"
                    st.rerun()
            
            # Input enhancement options
            with st.expander("🎯 Advanced Options"):
                complexity_level = st.selectbox(
                    "Complexity Level:",
                    ["Auto-detect", "Simple", "Medium", "Complex"],
                    key="complexity"
                )
                
                include_tests = st.checkbox("Include test cases", value=True)
                include_docs = st.checkbox("Include documentation", value=True)
                include_examples = st.checkbox("Include usage examples", value=True)
                
                performance_focus = st.checkbox("Focus on performance", value=False)
                security_focus = st.checkbox("Focus on security", value=True)

            if services['mcp']:
                st.markdown('<div class="mcp-box">🤖 Advanced MCP Server Ready - Supports 11+ Languages</div>', unsafe_allow_html=True)
            else:
                st.error("❌ MCP Server not connected")

            if st.button("🚀 Generate Multi-Language Code", key="generate_human", type="primary"):
                if human_input and enabled_languages and services['mcp']:
                    with st.spinner("🤖 Processing with Advanced MCP Server..."):
                        success, result = process_human_language(human_input, enabled_languages)
                        
                        if success:
                            extracted_rule = result.get('extracted_rule', {})
                            
                            st.success("✅ Successfully processed human language input!")
                            
                            # Enhanced extraction results
                            with st.expander("📋 Detailed Analysis"):
                                analysis_data = {
                                    "Original Input": human_input,
                                    "Extracted Field": extracted_rule.get('column_name', 'Unknown'),
                                    "Business Rule": extracted_rule.get('business_rule', 'Unknown'),
                                    "Data Type": extracted_rule.get('data_type', 'Unknown'),
                                    "Complexity": extracted_rule.get('complexity', 'Unknown'),
                                    "Context": extracted_rule.get('context', 'Unknown'),
                                    "Constraints": extracted_rule.get('constraints', {}),
                                    "Confidence": f"{result.get('confidence', 0)}%",
                                    "Processing Time": result.get('metadata', {}).get('processing_time', 'Unknown')
                                }
                                st.json(analysis_data)
                            
                            # Store the generated code
                            generated_code = result.get('generated_code', {})
                            
                            if generated_code:
                                st.session_state.generated_code = generated_code
                                st.session_state.rule_data = {
                                    'column': extracted_rule.get('column_name', 'field'),
                                    'rule': extracted_rule.get('business_rule', human_input),
                                    'human_input': human_input,
                                    'timestamp': datetime.now().isoformat(),
                                    'metadata': result.get('metadata', {})
                                }
                                st.success(f"✅ Generated code for {len(generated_code)} languages!")
                                st.balloons()
                            else:
                                st.error("❌ No code was generated")
                        else:
                            st.error(f"❌ MCP processing failed: {result}")
                
                elif not services['mcp']:
                    st.error("❌ MCP Server not connected")
                elif not enabled_languages:
                    st.error("❌ Please select target languages in the sidebar")
                else:
                    st.error("❌ Please provide input text")

        with col2:
            st.header("📊 Generated Code Results")
            
            if 'generated_code' in st.session_state:
                generated_code = st.session_state.generated_code
                rule_data = st.session_state.rule_data
                
                # Show input source with enhanced info
                metadata = rule_data.get('metadata', {})
                complexity = metadata.get('complexity', 'unknown')
                context = metadata.get('context', 'general')
                
                st.info(f"🗣️ Generated from: \"{rule_data['human_input']}\"\n📊 Complexity: {complexity.title()} | Context: {context.title()}")

                # Quick actions
                col_actions = st.columns(3)
                with col_actions[0]:
                    if st.button("☁️ Upload All to Drive", key="upload_all_drive"):
                        if services['google_drive']:
                            with st.spinner("Uploading to Google Drive..."):
                                file_extensions = {
                                    "python": ".py", "java": ".java", "nextjs": ".ts", "sql": ".sql",
                                    "bigquery": ".sql", "snowflake": ".sql", "go": ".go", 
                                    "rust": ".rs", "csharp": ".cs", "kotlin": ".kt", "scala": ".scala"
                                }
                                
                                files_to_upload = {}
                                for lang, code in generated_code.items():
                                    ext = file_extensions.get(lang, ".txt")
                                    filename = f"{rule_data['column']}_{lang}_validation{ext}"
                                    files_to_upload[filename] = code

                                success_count, total_count, messages = save_multiple_to_google_drive(files_to_upload)

                                if success_count == total_count:
                                    st.success(f"✅ All {success_count} files uploaded!")
                                else:
                                    st.warning(f"⚠️ {success_count}/{total_count} files uploaded")
                        else:
                            st.error("❌ Google Drive not connected")

                with col_actions[1]:
                    if st.button("📦 Download ZIP", key="download_all_zip"):
                        zip_buffer = io.BytesIO()
                        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                            file_extensions = {
                                "python": ".py", "java": ".java", "nextjs": ".ts", "sql": ".sql",
                                "bigquery": ".sql", "snowflake": ".sql", "go": ".go", 
                                "rust": ".rs", "csharp": ".cs", "kotlin": ".kt", "scala": ".scala"
                            }
                            
                            for lang, code in generated_code.items():
                                ext = file_extensions.get(lang, ".txt")
                                filename = f"{rule_data['column']}_{lang}_validation{ext}"
                                zip_file.writestr(filename, code)
                        
                        zip_buffer.seek(0)
                        
                        st.download_button(
                            label="📥 Download Multi-Language ZIP",
                            data=zip_buffer.getvalue(),
                            file_name=f"{rule_data['column']}_multilang_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
                            mime="application/zip"
                        )

                with col_actions[2]:
                    if st.button("📂 View Drive Folder", key="view_drive_folder"):
                        drive_url = f"https://drive.google.com/drive/folders/{os.getenv('GOOGLE_DRIVE_FOLDER_ID')}"
                        st.markdown(f"[🔗 Open Google Drive Folder]({drive_url})")

                # Enhanced code display with language categories
                if generated_code:
                    # Group by category for better organization
                    lang_categories = {
                        "Backend": ["python", "java", "go", "rust", "csharp", "kotlin", "scala"],
                        "Frontend": ["nextjs"],
                        "Database": ["sql"],
                        "Analytics": ["bigquery", "snowflake"]
                    }
                    
                    for category, langs in lang_categories.items():
                        category_codes = {lang: code for lang, code in generated_code.items() if lang in langs}
                        
                        if category_codes:
                            st.subheader(f"{category} Languages")
                            tabs = st.tabs([f"{lang.title()} {'🆕' if lang in ['bigquery', 'snowflake'] else ''}" for lang in category_codes.keys()])
                            
                            for i, (lang, code) in enumerate(category_codes.items()):
                                with tabs[i]:
                                    # Language-specific syntax highlighting
                                    syntax_map = {
                                        "nextjs": "typescript",
                                        "bigquery": "sql",
                                        "snowflake": "sql",
                                        "csharp": "csharp"
                                    }
                                    syntax = syntax_map.get(lang, lang)
                                    
                                    st.code(code, language=syntax)
                                    
                                    # Individual file actions
                                    file_extensions = {
                                        "python": ".py", "java": ".java", "nextjs": ".ts", "sql": ".sql",
                                        "bigquery": ".sql", "snowflake": ".sql", "go": ".go", 
                                        "rust": ".rs", "csharp": ".cs", "kotlin": ".kt", "scala": ".scala"
                                    }
                                    
                                    ext = file_extensions.get(lang, ".txt")
                                    filename = f"{rule_data['column']}_{lang}_validation{ext}"
                                    
                                    col_download, col_enhance = st.columns([1, 1])
                                    
                                    with col_download:
                                        st.download_button(
                                            label=f"📥 Download {lang.title()}",
                                            data=code,
                                            file_name=filename,
                                            mime="text/plain",
                                            key=f"download_{lang}"
                                        )
                                    
                                    with col_enhance:
                                        if st.button(f"⚡ Enhance {lang.title()}", key=f"enhance_{lang}"):
                                            st.session_state.enhance_code = code
                                            st.session_state.enhance_language = lang
                                            st.rerun()
            else:
                st.info("Generate code to see results here")

    with tab2:
        # Code Enhancement Tab
        st.header("⚡ Code Enhancement & Analysis")
        
        col_enhance1, col_enhance2 = st.columns([1, 1])
        
        with col_enhance1:
            st.subheader("🔧 Code Enhancement")
            
            # Code input for enhancement
            if 'enhance_code' in st.session_state:
                default_code = st.session_state.enhance_code
                default_lang = st.session_state.enhance_language
            else:
                default_code = "# Paste your code here for enhancement"
                default_lang = "python"
            
            enhancement_code = st.text_area(
                "Code to enhance:",
                value=default_code,
                height=200,
                key="enhancement_input"
            )
            
            enhancement_language = st.selectbox(
                "Language:",
                options=list(supported_languages.keys()),
                index=list(supported_languages.keys()).index(default_lang) if default_lang in supported_languages else 0,
                key="enhancement_language"
            )
            
            enhancement_type = st.selectbox(
                "Enhancement Type:",
                [
                    "general",
                    "performance",
                    "security", 
                    "error_handling",
                    "documentation",
                    "testing",
                    "refactoring",
                    "optimization"
                ],
                key="enhancement_type"
            )
            
            if st.button("⚡ Enhance Code", key="enhance_button", type="primary"):
                if enhancement_code and enhancement_code != "# Paste your code here for enhancement":
                    with st.spinner("🤖 Enhancing code with MCP..."):
                        success, result = enhance_existing_code(
                            enhancement_code, 
                            enhancement_language, 
                            enhancement_type
                        )
                        
                        if success:
                            st.session_state.enhanced_result = result
                            st.success("✅ Code enhanced successfully!")
                            st.rerun()
                        else:
                            st.error(f"❌ Enhancement failed: {result}")
                else:
                    st.error("❌ Please provide code to enhance")

        with col_enhance2:
            st.subheader("📊 Enhancement Results")
            
            if 'enhanced_result' in st.session_state:
                result = st.session_state.enhanced_result
                
                if result.get('success'):
                    st.success(f"✅ Enhanced {result.get('language', 'code')} for {result.get('enhancement_type', 'general')} improvements")
                    
                    # Show before/after comparison
                    st.subheader("📋 Enhanced Code")
                    enhanced_code = result.get('enhanced_code', '')
                    
                    syntax_map = {
                        "nextjs": "typescript",
                        "bigquery": "sql", 
                        "snowflake": "sql",
                        "csharp": "csharp"
                    }
                    syntax = syntax_map.get(result.get('language', ''), result.get('language', 'text'))
                    
                    st.code(enhanced_code, language=syntax)
                    
                    # Enhancement metadata
                    with st.expander("📊 Enhancement Details"):
                        enhancement_info = {
                            "Original Language": result.get('language', 'Unknown'),
                            "Enhancement Type": result.get('enhancement_type', 'Unknown'),
                            "Confidence": f"{result.get('confidence', 0)}%",
                            "Processing Time": f"{result.get('processing_time', 0):.2f}s"
                        }
                        st.json(enhancement_info)
                    
                    # Actions for enhanced code
                    col_enhanced_actions = st.columns(3)
                    
                    with col_enhanced_actions[0]:
                        filename = f"enhanced_{result.get('language', 'code')}_{enhancement_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                        file_ext = {
                            "python": ".py", "java": ".java", "nextjs": ".ts", "sql": ".sql",
                            "bigquery": ".sql", "snowflake": ".sql", "go": ".go", 
                            "rust": ".rs", "csharp": ".cs"
                        }.get(result.get('language', ''), '.txt')
                        
                        st.download_button(
                            label="📥 Download Enhanced",
                            data=enhanced_code,
                            file_name=f"{filename}{file_ext}",
                            mime="text/plain",
                            key="download_enhanced"
                        )
                    
                    with col_enhanced_actions[1]:
                        if services['google_drive'] and st.button("☁️ Save to Drive", key="save_enhanced_drive"):
                            success, message = save_to_google_drive(f"{filename}{file_ext}", enhanced_code)
                            if success:
                                st.success(message)
                            else:
                                st.error(message)
                    
                    with col_enhanced_actions[2]:
                        if st.button("📊 Analyze Enhanced", key="analyze_enhanced"):
                            with st.spinner("Analyzing enhanced code..."):
                                analysis_success, analysis_result = analyze_code(enhanced_code, result.get('language', 'python'))
                                
                                if analysis_success:
                                    st.session_state.analysis_result = analysis_result
                                    st.rerun()
                else:
                    st.error("❌ Enhancement failed")
            else:
                st.info("Enhance code to see results here")
            
            # Code Analysis Section
            if 'analysis_result' in st.session_state:
                st.subheader("📊 Code Analysis")
                analysis = st.session_state.analysis_result
                
                if analysis.get('success'):
                    metrics = analysis.get('metrics', {})
                    
                    # Display metrics
                    metric_cols = st.columns(3)
                    with metric_cols[0]:
                        st.metric("Lines of Code", metrics.get('lines_of_code', 0))
                    with metric_cols[1]:
                        st.metric("Characters", metrics.get('character_count', 0))
                    with metric_cols[2]:
                        st.metric("Complexity", metrics.get('estimated_complexity', 'Unknown'))
                    
                    # Suggestions
                    suggestions = analysis.get('suggestions', [])
                    if suggestions:
                        st.subheader("💡 Suggestions")
                        for suggestion in suggestions:
                            st.write(f"• {suggestion}")

    with tab3:
        # Batch Processing Tab
        st.header("📊 Advanced Batch Processing")
        
        uploaded_file = st.file_uploader(
            "Upload Rules CSV", 
            type=['csv'], 
            help="CSV should have 'human_input' column or 'column_name' + 'rules' columns",
            key="batch_upload"
        )
        
        if uploaded_file is not None:
            try:
                df = pd.read_csv(uploaded_file)
                st.success(f"✅ Loaded {len(df)} rules")
                st.dataframe(df.head())
                
                # Batch processing options
                batch_col1, batch_col2 = st.columns([1, 1])
                
                with batch_col1:
                    use_mcp_batch = st.checkbox("🤖 Use Advanced MCP Processing", value=services['mcp'])
                    auto_upload_batch = st.checkbox("☁️ Auto-upload to Google Drive", value=services['google_drive'])
                    
                with batch_col2:
                    batch_enhancement = st.checkbox("⚡ Apply code enhancement", value=False)
                    enhancement_type_batch = st.selectbox(
                        "Enhancement type:", 
                        ["performance", "security", "general", "optimization"],
                        key="batch_enhancement_type"
                    )

                if st.button("🚀 Process All Rules (Advanced)", key="batch_process", type="primary"):
                    if enabled_languages:
                        # Check columns
                        has_human = 'human_input' in df.columns
                        has_structured = 'column_name' in df.columns and 'rules' in df.columns
                        
                        if not (has_human or has_structured):
                            st.error("❌ CSV must have either 'human_input' OR ('column_name' + 'rules') columns")
                            return

                        progress_bar = st.progress(0)
                        status_text = st.empty()
                        
                        all_files = {}
                        processing_results = []

                        with st.spinner("Processing batch with Advanced MCP..."):
                            for idx, row in df.iterrows():
                                status_text.text(f"Processing rule {idx+1}/{len(df)}...")
                                
                                try:
                                    if has_human and pd.notna(row.get('human_input', '')):
                                        # Human language processing
                                        human_input = str(row['human_input']).strip()
                                        
                                        if use_mcp_batch and services['mcp']:
                                            success, result = process_human_language(human_input, enabled_languages)
                                            
                                            if success:
                                                generated_code = result.get('generated_code', {})
                                                extracted_rule = result.get('extracted_rule', {})
                                                column = extracted_rule.get('column_name', f'field_{idx}')
                                                
                                                # Apply enhancement if requested
                                                if batch_enhancement:
                                                    enhanced_code = {}
                                                    for lang, code in generated_code.items():
                                                        enh_success, enh_result = enhance_existing_code(code, lang, enhancement_type_batch)
                                                        if enh_success:
                                                            enhanced_code[lang] = enh_result.get('enhanced_code', code)
                                                        else:
                                                            enhanced_code[lang] = code
                                                    generated_code = enhanced_code
                                                
                                                processing_results.append({
                                                    "Input": human_input,
                                                    "Method": "Advanced MCP + Enhancement" if batch_enhancement else "Advanced MCP",
                                                    "Extracted Field": column,
                                                    "Languages": len(generated_code),
                                                    "Status": "✅ Success"
                                                })
                                            else:
                                                processing_results.append({
                                                    "Input": human_input,
                                                    "Method": "MCP Error",
                                                    "Extracted Field": "Error", 
                                                    "Languages": 0,
                                                    "Status": f"❌ {result}"
                                                })
                                                continue
                                        else:
                                            # Fallback processing
                                            column = f"field_{idx}"
                                            generated_code = {"python": f"# Fallback code for {human_input}"}
                                            
                                            processing_results.append({
                                                "Input": human_input,
                                                "Method": "Fallback",
                                                "Extracted Field": column,
                                                "Languages": 1,
                                                "Status": "⚠️ Limited"
                                            })
                                    
                                    elif has_structured:
                                        # Structured input processing
                                        column = str(row['column_name']).strip()
                                        rule = str(row['rules']).strip()
                                        
                                        if column and rule:
                                            # Use MCP for structured input too
                                            if use_mcp_batch and services['mcp']:
                                                success, result = process_human_language(f"{column}: {rule}", enabled_languages)
                                                if success:
                                                    generated_code = result.get('generated_code', {})
                                                else:
                                                    generated_code = {"python": f"# Error processing {column}"}
                                            else:
                                                generated_code = {"python": f"# Basic validation for {column}"}
                                            
                                            processing_results.append({
                                                "Input": f"{column}: {rule}",
                                                "Method": "Structured MCP" if use_mcp_batch else "Structured Basic",
                                                "Extracted Field": column,
                                                "Languages": len(generated_code),
                                                "Status": "✅ Success"
                                            })
                                        else:
                                            continue
                                    else:
                                        continue

                                    # Add generated files to collection
                                    file_extensions = {
                                        "python": ".py", "java": ".java", "nextjs": ".ts", "sql": ".sql",
                                        "bigquery": ".sql", "snowflake": ".sql", "go": ".go", 
                                        "rust": ".rs", "csharp": ".cs", "kotlin": ".kt", "scala": ".scala"
                                    }
                                    
                                    for lang, code in generated_code.items():
                                        ext = file_extensions.get(lang, ".txt")
                                        filename = f"{column}_{lang}_validation{ext}"
                                        all_files[filename] = code

                                except Exception as e:
                                    processing_results.append({
                                        "Input": str(row),
                                        "Method": "Error",
                                        "Extracted Field": "Error",
                                        "Languages": 0,
                                        "Status": f"❌ {str(e)}"
                                    })

                                progress_bar.progress((idx + 1) / len(df))

                        status_text.text("✅ Advanced batch processing complete!")

                        # Enhanced results display
                        st.subheader("📊 Processing Results")
                        results_df = pd.DataFrame(processing_results)
                        st.dataframe(results_df)

                        # Statistics
                        success_count = len([r for r in processing_results if r["Status"].startswith("✅")])
                        total_languages = sum([r["Languages"] for r in processing_results if isinstance(r["Languages"], int)])
                        
                        col_stats = st.columns(4)
                        with col_stats[0]:
                            st.metric("Processed Rules", f"{success_count}/{len(processing_results)}")
                        with col_stats[1]:
                            st.metric("Generated Files", len(all_files))
                        with col_stats[2]:
                            st.metric("Total Languages", total_languages)
                        with col_stats[3]:
                            st.metric("Success Rate", f"{success_count/len(processing_results)*100:.1f}%")

                        # Batch actions
                        if all_files:
                            st.subheader("📦 Batch Actions")
                            batch_action_cols = st.columns(3)
                            
                            with batch_action_cols[0]:
                                # Download ZIP
                                zip_buffer = io.BytesIO()
                                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                                    for filename, content in all_files.items():
                                        zip_file.writestr(filename, content)
                                
                                zip_buffer.seek(0)
                                
                                st.download_button(
                                    label=f"📦 Download All ({len(all_files)} files)",
                                    data=zip_buffer.getvalue(),
                                    file_name=f"advanced_batch_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
                                    mime="application/zip"
                                )
                            
                            with batch_action_cols[1]:
                                # Upload to Google Drive
                                if services['google_drive'] and st.button("☁️ Upload All to Drive", key="batch_upload_drive"):
                                    with st.spinner("Uploading batch files..."):
                                        success_count, total_count, messages = save_multiple_to_google_drive(all_files)
                                        
                                        if success_count == total_count:
                                            st.success(f"✅ All {success_count} files uploaded!")
                                            st.balloons()
                                        else:
                                            st.warning(f"⚠️ {success_count}/{total_count} files uploaded")
                            
                            with batch_action_cols[2]:
                                # Show file breakdown
                                if st.button("📊 File Breakdown", key="file_breakdown"):
                                    lang_counts = {}
                                    for filename in all_files.keys():
                                        for lang in supported_languages.keys():
                                            if f"_{lang}_" in filename:
                                                lang_counts[lang] = lang_counts.get(lang, 0) + 1
                                                break
                                    
                                    st.json(lang_counts)

                    else:
                        st.error("❌ Please select target languages in the sidebar")

            except Exception as e:
                st.error(f"❌ Error reading CSV: {e}")

    # Human Language Examples
    if services['mcp']:
        st.header("🗣️ Advanced Human Language Examples")
        st.markdown('<div class="mcp-box">🌟 Try these advanced examples with the Enhanced MCP Server</div>', unsafe_allow_html=True)
        
        examples = [
            {"text": "📧 Email Validation", "input": "Email addresses should be valid and not contain noreply"},
            {"text": "📊 BigQuery Analytics", "input": "BigQuery: Check if user_id exists in users table and user is active"},
            {"text": "❄️ Snowflake Pipeline", "input": "Snowflake: Validate JSON schema for events with required fields"},
            {"text": "🔵 Go Microservice", "input": "Go: API endpoint for phone numbers with international country codes"},
            {"text": "🦀 Rust Performance", "input": "Rust: High-performance validation for financial transaction amounts"},
            {"text": "#️⃣ C# Enterprise", "input": "C#: Enterprise-grade password validation with complexity requirements"}
        ]
        
        example_cols = st.columns(3)
        
        for i, example in enumerate(examples):
            col_idx = i % 3
            with example_cols[col_idx]:
                if st.button(example["text"], key=f"example_{i}"):
                    st.session_state.human_input_value = example["input"]
                    st.rerun()

    # Footer with enhanced info
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666;">
        🚀 Advanced Multi-Language Code Generator |
        🗣️ Human Language Support via Enhanced MCP |
        💾 Real Google Drive Integration |
        🎯 11+ Languages: Python • Java • Next.js • SQL • BigQuery • Snowflake • Go • Rust • C# • Kotlin • Scala |
        ⚡ Code Enhancement & Analysis |
        📊 Advanced Batch Processing
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
