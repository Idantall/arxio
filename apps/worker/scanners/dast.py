import os
import json
import time
import redis
import requests
from typing import Dict, List, Any

# קישור למסד הנתונים Redis
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

# הגדרות ZAP API
ZAP_API_URL = os.getenv("ZAP_API_URL", "http://zap:8080/JSON")

def start_zap_session(target_url: str) -> str:
    """יצירת סשן חדש ב-ZAP והפעלת סריקה בסיסית"""
    session_id = f"arxio-scan-{int(time.time())}"
    
    # אתחול סשן ZAP חדש
    requests.get(f"{ZAP_API_URL}/core/action/newSession", params={"name": session_id})
    
    # הגדרת המטרה ל-ZAP
    requests.get(f"{ZAP_API_URL}/core/action/accessUrl", params={"url": target_url})
    
    return session_id

def run_spider(target_url: str, project_id: str) -> None:
    """הפעלת ה-Spider לגילוי דפים ונתיבים באתר"""
    # עדכון התקדמות
    redis_client.publish(
        f"scan:{project_id}",
        json.dumps({
            "type": "progress",
            "status": "scanning",
            "projectId": project_id,
            "message": "מריץ סריקת Spider לגילוי נתיבים..."
        })
    )
    
    # מתחיל סריקת Spider
    response = requests.get(
        f"{ZAP_API_URL}/spider/action/scan",
        params={"url": target_url, "maxChildren": 10}
    )
    
    scan_id = json.loads(response.text)["scan"]
    
    # מעקב אחר התקדמות ה-Spider
    while True:
        status_response = requests.get(
            f"{ZAP_API_URL}/spider/view/status",
            params={"scanId": scan_id}
        )
        progress = int(json.loads(status_response.text)["status"])
        
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "progress",
                "status": "scanning",
                "projectId": project_id,
                "message": f"סריקת Spider: {progress}% הושלמו"
            })
        )
        
        if progress >= 100:
            break
            
        time.sleep(2)

def run_active_scan(target_url: str, project_id: str) -> List[Dict[str, Any]]:
    """הפעלת סריקה אקטיבית לזיהוי פגיעויות"""
    # עדכון התקדמות
    redis_client.publish(
        f"scan:{project_id}",
        json.dumps({
            "type": "progress",
            "status": "scanning",
            "projectId": project_id,
            "message": "מריץ סריקה אקטיבית לזיהוי פגיעויות..."
        })
    )
    
    # התחלת סריקה אקטיבית
    response = requests.get(
        f"{ZAP_API_URL}/ascan/action/scan",
        params={"url": target_url, "recurse": "true", "inScopeOnly": "true"}
    )
    
    scan_id = json.loads(response.text)["scan"]
    
    # מעקב אחר התקדמות הסריקה האקטיבית
    while True:
        status_response = requests.get(
            f"{ZAP_API_URL}/ascan/view/status",
            params={"scanId": scan_id}
        )
        progress = int(json.loads(status_response.text)["status"])
        
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "progress",
                "status": "scanning",
                "projectId": project_id,
                "message": f"סריקה אקטיבית: {progress}% הושלמו"
            })
        )
        
        if progress >= 100:
            break
            
        time.sleep(5)
    
    # קבלת התראות מ-ZAP
    alerts_response = requests.get(f"{ZAP_API_URL}/core/view/alerts")
    return json.loads(alerts_response.text)["alerts"]

def map_zap_severity(risk: str) -> str:
    """המרת רמות סיכון של ZAP לחומרות סטנדרטיות"""
    risk = risk.lower()
    if risk == "high":
        return "HIGH"
    elif risk == "medium":
        return "MEDIUM"
    elif risk == "low":
        return "LOW"
    else:
        return "INFO"

def run_dast(project_id: str, url: str):
    """הרצת סריקת אבטחה דינמית מלאה"""
    try:
        # עדכון סטטוס התחלת הסריקה
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "progress",
                "status": "starting",
                "projectId": project_id,
                "message": "מתחיל סריקת DAST..."
            })
        )
        
        # התחלת סשן ZAP
        start_zap_session(url)
        
        # הרצת Spider לגילוי תוכן
        run_spider(url, project_id)
        
        # הרצת סריקה אקטיבית
        findings = run_active_scan(url, project_id)
        
        # עיבוד וחיווי הממצאים
        for finding in findings:
            mapped_finding = {
                "severity": map_zap_severity(finding.get("risk", "info")),
                "ruleId": finding.get("pluginId", "unknown"),
                "title": finding.get("name", "Unknown issue"),
                "description": finding.get("description", "No description"),
                "url": finding.get("url", ""),
                "evidence": finding.get("evidence", "")
            }
            
            # פרסום הממצא
            redis_client.publish(
                f"scan:{project_id}",
                json.dumps({
                    "type": "finding",
                    "tool": "zap",
                    "projectId": project_id,
                    "finding": mapped_finding
                })
            )
        
        # עדכון סטטוס סיום הסריקה
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "progress",
                "status": "completed",
                "projectId": project_id,
                "message": "סריקת DAST הושלמה",
                "findings_count": len(findings)
            })
        )
        
    except Exception as e:
        # דיווח על שגיאה
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "error",
                "status": "error",
                "projectId": project_id,
                "message": f"שגיאה בסריקת DAST: {str(e)}"
            })
        ) 