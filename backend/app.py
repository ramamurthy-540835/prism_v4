from fastapi import FastAPI

from knowledge.api.routes import router as knowledge_router

app = FastAPI(title="PRISM API")
app.include_router(knowledge_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "prism-api"}
