from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import spec, plan, tasks, review, constitution

app = FastAPI(
    title="SpecFlow AI Service",
    description="AI-powered spec generation and code review service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spec.router, prefix="/spec", tags=["spec"])
app.include_router(plan.router, prefix="/plan", tags=["plan"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(review.router, prefix="/review", tags=["review"])
app.include_router(constitution.router, prefix="/constitution", tags=["constitution"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "specflow-ai"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
