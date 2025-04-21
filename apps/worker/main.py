import os
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import redis
import json
from typing import Optional
from scanners.sast import run_sast
from scanners.dast import run_dast

app = FastAPI(title="ARXIO Security Scanner Worker")

# Connect to Redis database
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

class ScanRequest(BaseModel):
    project_id: str
    repo_url: str
    branch: str
    deployed_url: Optional[str] = None

@app.get("/")
async def root():
    return {"status": "healthy", "service": "ARXIO Security Scanner"}

@app.post("/api/scan/sast")
async def start_sast_scan(scan_request: ScanRequest, background_tasks: BackgroundTasks):
    """Start a static application security test (SAST) on the source code"""
    # Add task to background
    background_tasks.add_task(
        run_sast,
        project_id=scan_request.project_id,
        repo_url=scan_request.repo_url,
        branch=scan_request.branch
    )
    
    # Publish scan start message
    redis_client.publish(
        f"scan:{scan_request.project_id}",
        json.dumps({
            "type": "sast",
            "status": "started",
            "projectId": scan_request.project_id
        })
    )
    
    return {"status": "started", "type": "sast", "project_id": scan_request.project_id}

@app.post("/api/scan/dast")
async def start_dast_scan(scan_request: ScanRequest, background_tasks: BackgroundTasks):
    """Start a dynamic application security test (DAST) on the deployed application"""
    if not scan_request.deployed_url:
        return {"error": "Deployed URL is required for DAST scans"}
    
    # Add task to background
    background_tasks.add_task(
        run_dast,
        project_id=scan_request.project_id,
        url=scan_request.deployed_url
    )
    
    # Publish scan start message
    redis_client.publish(
        f"scan:{scan_request.project_id}",
        json.dumps({
            "type": "dast",
            "status": "started",
            "projectId": scan_request.project_id
        })
    )
    
    return {"status": "started", "type": "dast", "project_id": scan_request.project_id}

@app.get("/api/health")
async def health_check():
    """Check service health"""
    redis_health = "ok"
    try:
        redis_client.ping()
    except Exception as e:
        redis_health = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "redis": redis_health,
        "version": "0.1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 