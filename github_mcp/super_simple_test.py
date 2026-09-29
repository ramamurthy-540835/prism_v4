#!/usr/bin/env python3
"""
Super Simple Test for DeepSeek SQL Generation
This script replicates the functionality of the provided bash test in Python.
"""

import requests
import json

# Configuration
ENDPOINT = "http://llm-loadbalancer.local:80/v1/chat/completions"
MODEL = "deepseek-coder"

# Prompt
PROMPT = """You are a SQL expert. Convert this rule to SQL:

Column: customer_email
Rule: Must be valid email format

Return ONLY JSON:
{
  "sql_condition": "your SQL here", 
  "confidence": 85,
  "explanation": "brief explanation"
}
"""

# Test function
def test_deepseek_sql_generation():
    print("🚀 Testing DeepSeek SQL Generation")
    print("==================================")
    print(f"📝 Testing endpoint: {ENDPOINT}")
    print(f"🤖 Model: {MODEL}")
    print("")

    # Request payload
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": PROMPT}
        ],
        "max_tokens": 256,
        "temperature": 0.2,
    }

    # Make POST request
    try:
        response = requests.post(ENDPOINT, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        print("✅ Response received:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_deepseek_sql_generation()
