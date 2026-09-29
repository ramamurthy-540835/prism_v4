#!/bin/bash

# GitLab MCP Server Setup Script
# Automates the complete installation and configuration process

set -e  # Exit on any error

echo "🚀 GitLab MCP Server Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
}

# Check if Python 3.8+ is available
check_python() {
    print_step "Checking Python version..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python not found. Please install Python 3.8+ first."
        exit 1
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    MAJOR_VERSION=$(echo $PYTHON_VERSION | cut -d. -f1)
    MINOR_VERSION=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$MAJOR_VERSION" -lt 3 ] || ([ "$MAJOR_VERSION" -eq 3 ] && [ "$MINOR_VERSION" -lt 8 ]); then
        print_error "Python 3.8+ required. Found: $PYTHON_VERSION"
        exit 1
    fi
    
    print_status "Python $PYTHON_VERSION found ✓"
}

# Create project structure
create_project_structure() {
    print_step "Creating project structure..."
    
    PROJECT_DIR="gitlab-mcp"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Directory $PROJECT_DIR already exists. Continue? (y/n)"
        read -r response
        if [ "$response" != "y" ]; then
            print_error "Setup cancelled."
            exit 1
        fi
    else
        mkdir -p "$PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR"
    
    # Create subdirectories
    mkdir -p {logs,templates,examples,sql,queries}
    
    print_status "Project structure created ✓"
}

# Setup virtual environment
setup_virtual_env() {
    print_step "Setting up virtual environment..."
    
    if [ ! -d "venv" ]; then
        $PYTHON_CMD -m venv venv
        print_status "Virtual environment created ✓"
    else
        print_status "Virtual environment already exists ✓"
    fi
    
    # Activate virtual environment
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    
    # Upgrade pip
    pip install --upgrade pip
    
    print_status "Virtual environment activated ✓"
}

# Install dependencies
install_dependencies() {
    print_step "Installing Python dependencies..."
    
    # Core dependencies
    pip install mcp==1.0.0
    pip install pydantic>=2.0.0
    pip install requests>=2.31.0
    pip install python-dotenv>=1.0.0
    pip install pandas>=2.0.0
    pip install jinja2>=3.1.0
    
    # Optional dependencies
    print_status "Installing optional dependencies..."
    pip install google-generativeai>=0.3.0 || print_warning "Failed to install google-generativeai"
    pip install streamlit>=1.28.0 || print_warning "Failed to install streamlit"
    
    print_status "Dependencies installed ✓"
}

# Get GitLab configuration
configure_gitlab() {
    print_step "Configuring GitLab connection..."
    
    if [ ! -f ".env" ]; then
        echo "Please provide your GitLab configuration:"
        
        # GitLab URL
        echo -n "GitLab URL (default: https://gitlab.com): "
        read -r GITLAB_URL
        GITLAB_URL=${GITLAB_URL:-"https://gitlab.com"}
        
        # GitLab Token
        echo -n "GitLab Personal Access Token: "
        read -r GITLAB_TOKEN
        
        if [ -z "$GITLAB_TOKEN" ]; then
            print_error "GitLab token is required!"
            print_status "To create a token:"
            print_status "1. Go to GitLab → Profile → Settings → Access Tokens"
            print_status "2. Create token with scopes: api, write_repository, read_repository"
            print_status "3. Copy the token and run this script again"
            exit 1
        fi
        
        # Project ID
        echo -n "GitLab Project ID: "
        read -r GITLAB_PROJECT_ID
        
        if [ -z "$GITLAB_PROJECT_ID" ]; then
            print_warning "Project ID not provided. You can set it later in .env file"
            GITLAB_PROJECT_ID="your_project_id_here"
        fi
        
        # Optional: Gemini API Key
        echo -n "Gemini API Key (optional, for fallback LLM): "
        read -r GEMINI_API_KEY
        GEMINI_API_KEY=${GEMINI_API_KEY:-"your_gemini_api_key_here"}
        
        # Create .env file
        cat > .env << EOF
# GitLab Configuration
GITLAB_URL=$GITLAB_URL
GITLAB_TOKEN=$GITLAB_TOKEN
GITLAB_PROJECT_ID=$GITLAB_PROJECT_ID

# LLM Configuration
ENABLE_LLM=true
LOCAL_LLM_MODEL=mistral
LOCAL_LLM_TEMPERATURE=0.1
LOCAL_LLM_TIMEOUT=300
LLM_ENDPOINTS=http://localhost:11434/v1/chat/completions
MAX_CONCURRENT_LLM_REQUESTS=6

# Fallback LLM
LLM_FALLBACK_PROVIDER=gemini
GEMINI_API_KEY=$GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=1024

# LangGraph Configuration
LANGGRAPH_MAX_ITERATIONS=2
LANGGRAPH_CONFIDENCE_THRESHOLD=85
LANGGRAPH_IMPROVEMENT_THRESHOLD=10

# MCP Server Configuration
MCP_SERVER_NAME=gitlab-mcp
MCP_SERVER_VERSION=1.0.0
MCP_LOG_LEVEL=INFO

# Prompt Templates
PROMPT_TEMPLATES_FILE=prompt_template.json
EOF
        
        print_status "Configuration saved to .env ✓"
    else
        print_status "Configuration file .env already exists ✓"
    fi
}

# Test GitLab connection
test_gitlab_connection() {
    print_step "Testing GitLab connection..."
    
    # Load environment
    source .env
    
    # Test API call
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        "$GITLAB_URL/api/v4/user")
    
    if [ "$RESPONSE" = "200" ]; then
        print_status "GitLab connection successful ✓"
        
        # Get user info
        USER_INFO=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                    "$GITLAB_URL/api/v4/user")
        USER_NAME=$(echo "$USER_INFO" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        print_status "Connected as: $USER_NAME"
    else
        print_error "GitLab connection failed (HTTP $RESPONSE)"
        print_status "Please check your token and URL in .env file"
        return 1
    fi
}

# Create sample files
create_sample_files() {
    print_step "Creating sample files..."
    
    # Sample rules.csv
    cat > rules.csv << 'EOF'
column_name,rules
customer_email,"Must be valid email format; Must not contain noreply"
customer_age,"Must be a number between 18 and 120"
customer_name,"Must contain only alphabetic characters and spaces"
account_balance,"Must be numeric and greater than or equal to 0"
phone_number,"Must be valid phone number format"
EOF
    
    # Sample data
    cat > sample_data.csv << 'EOF'
customer_email,customer_age,customer_name,account_balance,phone_number
john@example.com,25,John Doe,1000.50,+1-555-123-4567
invalid-email,150,Jane123,-250,invalid-phone
noreply@company.com,-5,Mary Smith,5000,555.123.4567
jane@test.co.uk,30,Alice,0,+44-20-7946-0958
valid@domain.org,45,Tom,2500.75,1-800-555-0199
EOF
    
    # Quick test script
    cat > quick_test.py << 'EOF'
#!/usr/bin/env python3
"""Quick test of MCP setup"""

import os
import requests
from dotenv import load_dotenv

def test_setup():
    print("🧪 Testing GitLab MCP Setup")
    print("=" * 30)
    
    # Load environment
    load_dotenv()
    
    # Test environment variables
    required_vars = ['GITLAB_URL', 'GITLAB_TOKEN']
    for var in required_vars:
        value = os.getenv(var)
        if value and value != f'your_{var.lower()}_here':
            print(f"✅ {var}: configured")
        else:
            print(f"❌ {var}: missing or default value")
            return False
    
    # Test GitLab connection
    try:
        response = requests.get(
            f"{os.getenv('GITLAB_URL')}/api/v4/user",
            headers={'PRIVATE-TOKEN': os.getenv('GITLAB_TOKEN')},
            timeout=10
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ GitLab connection: successful")
            print(f"   User: {user_data.get('name', 'Unknown')}")
            print(f"   Username: {user_data.get('username', 'Unknown')}")
        else:
            print(f"❌ GitLab connection: failed (HTTP {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ GitLab connection: error - {e}")
        return False
    
    print("\n🎉 Setup test completed successfully!")
    return True

if __name__ == "__main__":
    test_setup()
EOF
    
    # Make quick test executable
    chmod +x quick_test.py
    
    print_status "Sample files created ✓"
}

# Create startup scripts
create_startup_scripts() {
    print_step "Creating startup scripts..."
    
    # MCP Server startup script
    cat > start_mcp_server.sh << 'EOF'
#!/bin/bash
# Start GitLab MCP Server

echo "🚀 Starting GitLab MCP Server..."

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate

# Load environment
source .env 2>/dev/null || echo "Warning: .env file not found"

# Start server
python gitlab_mcp_server.py "$@"
EOF
    
    # Windows batch file
    cat > start_mcp_server.bat << 'EOF'
@echo off
echo 🚀 Starting GitLab MCP Server...

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start server
python gitlab_mcp_server.py %*
EOF
    
    # Demo script
    cat > run_demo.sh << 'EOF'
#!/bin/bash
# Run MCP Demo

echo "🎬 Running GitLab MCP Demo..."

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate

# Load environment
source .env 2>/dev/null || echo "Warning: .env file not found"

# Run demo
python mcp_client_example.py demo
EOF
    
    # Make scripts executable
    chmod +x start_mcp_server.sh run_demo.sh
    
    print_status "Startup scripts created ✓"
}

# Final instructions
show_final_instructions() {
    print_step "Setup Complete! 🎉"
    
    echo ""
    echo "📋 Next Steps:"
    echo "=============="
    echo ""
    echo "1. Test your setup:"
    echo "   ./quick_test.py"
    echo ""
    echo "2. Start the MCP server:"
    echo "   ./start_mcp_server.sh"
    echo ""
    echo "3. Run demo workflows:"
    echo "   ./run_demo.sh"
    echo ""
    echo "4. Or use the client directly:"
    echo "   python mcp_client_example.py"
    echo ""
    echo "📁 Project Structure:"
    echo "===================="
    echo "├── gitlab_mcp_server.py     # Main MCP server"
    echo "├── mcp_client_example.py    # Usage examples"
    echo "├── prompt_template.json     # AI prompt templates"
    echo "├── .env                     # Configuration"
    echo "├── rules.csv               # Sample data quality rules"
    echo "├── sample_data.csv         # Sample data"
    echo "├── quick_test.py           # Setup verification"
    echo "├── start_mcp_server.sh     # Server startup script"
    echo "└── run_demo.sh             # Demo runner"
    echo ""
    echo "🔧 Configuration Files:"
    echo "======================="
    echo "• .env - Edit this file to update your GitLab settings"
    echo "• prompt_template.json - Customize AI prompts"
    echo ""
    echo "📚 Documentation:"
    echo "================"
    echo "• README files contain detailed usage instructions"
    echo "• Check logs/ directory for server logs"
    echo "• Use MCP_LOG_LEVEL=DEBUG for troubleshooting"
    echo ""
    echo "🆘 Troubleshooting:"
    echo "=================="
    echo "• Run: ./quick_test.py to verify setup"
    echo "• Check .env file for correct GitLab credentials"
    echo "• Ensure GitLab token has required scopes"
    echo "• Check GitLab Premium/Ultimate for Code Suggestions"
    echo ""
}

# Main execution
main() {
    echo "Starting GitLab MCP Server setup..."
    echo "This script will:"
    echo "  ✓ Check Python installation"
    echo "  ✓ Create project structure"
    echo "  ✓ Setup virtual environment"
    echo "  ✓ Install dependencies"
    echo "  ✓ Configure GitLab connection"
    echo "  ✓ Test the setup"
    echo "  ✓ Create sample files and scripts"
    echo ""
    echo "Press Enter to continue or Ctrl+C to cancel..."
    read -r
    
    check_python
    create_project_structure
    setup_virtual_env
    install_dependencies
    configure_gitlab
    
    # Test connection (optional - continue even if it fails)
    if ! test_gitlab_connection; then
        print_warning "GitLab connection test failed, but continuing setup..."
        print_status "You can fix the connection later and rerun quick_test.py"
    fi
    
    create_sample_files
    create_startup_scripts
    show_final_instructions
    
    print_status "GitLab MCP Server setup completed successfully! 🚀"
}

# Handle script interruption
trap 'print_error "Setup interrupted by user"; exit 1' INT

# Check if running as source or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi