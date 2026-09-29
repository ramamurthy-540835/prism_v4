import aiohttp
import asyncio
import json

async def test_endpoint(endpoint, payload):
    async with aiohttp.ClientSession() as session:
        async with session.post(endpoint, json=payload) as response:
            status = response.status
            try:
                data = await response.json()
            except Exception:
                data = await response.text()
            return status, data

async def main():
    endpoint = "http://llm-loadbalancer.local:80/v1/chat/completions"
    payload = {
        "model": "deepseek-coder",
        "messages": [
            {"role": "user", "content": "Convert rule to SQL."}
        ],
        "max_tokens": 256,
        "temperature": 0.2
    }
    status, data = await test_endpoint(endpoint, payload)
    print(f"HTTP Status: {status}")
    print("Response:", json.dumps(data, indent=2))

asyncio.run(main())
