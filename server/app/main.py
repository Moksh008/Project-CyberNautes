from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, ingest, analyze, labs, remediation, sast
from .core.config import settings
from .core.neo4j_db import neo4j_driver
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SentinelAI API",
    description="Backend for the AI-Powered Cyber Defense Twin",
    version="1.0.0",
)

# CORS middleware to allow Web, Localhost, and Mobile app connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["Ingestion"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(labs.router, prefix="/api/labs", tags=["Labs"])
app.include_router(remediation.router, prefix="/api/remediation", tags=["Remediation"])
app.include_router(sast.router, prefix="/api/sast", tags=["SAST Analysis"])

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down SentinelAI API...")
    neo4j_driver.close()

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
