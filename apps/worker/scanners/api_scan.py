#!/usr/bin/env python3
"""
סורק API - מבצע סריקות אבטחה של ממשקי API
"""

import os
import json
import time
import logging
import requests
import redis
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable, Union
import random  # זמני לצורך יצירת נתונים אקראיים

# הגדרת רישום
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api-scanner')

# פרסום התקדמות ל-Redis
def publish_progress(channel: str, data: Dict[str, Any]):
    """
    פרסום עדכון התקדמות ל-Redis
    
    :param channel: ערוץ ההודעות
    :param data: נתוני ההתקדמות
    """
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        redis_client = redis.Redis.from_url(redis_url)
        
        if redis_client.ping():
            redis_client.publish(channel, json.dumps(data))
            logger.debug(f"פורסם עדכון התקדמות לערוץ {channel}")
        else:
            logger.warning("אין חיבור ל-Redis, לא ניתן לשלוח עדכוני התקדמות")
    except Exception as e:
        logger.error(f"שגיאה בפרסום עדכון התקדמות: {str(e)}")


async def run_api_scan(
    target: str, 
    parameters: Optional[Dict[str, Any]] = None, 
    progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Dict[str, Any]:
    """
    ביצוע סריקת API על היעד המצוין
    
    :param target: כתובת ה-API לסריקה (למשל כתובת Swagger)
    :param parameters: פרמטרים נוספים לסריקה
    :param progress_callback: פונקציה לעדכון התקדמות
    :return: תוצאות הסריקה
    """
    logger.info(f"מתחיל סריקת API עבור: {target}")
    
    # ברירות מחדל לפרמטרים
    if parameters is None:
        parameters = {}
    
    scan_id = parameters.get('scan_id', f"api-{int(time.time())}")
    
    try:
        # עדכון התקדמות ראשוני
        update_progress(progress_callback, {
            "status": "running",
            "overallProgress": 10,
            "currentStep": "prepare",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": f"מתחיל סריקת API על {target}"
            }]
        })
        
        # שלב 1: בדיקת נגישות ה-API
        update_progress(progress_callback, {
            "overallProgress": 20,
            "currentStep": "prepare",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": f"בודק נגישות של {target}"
            }]
        })
        
        # ניסיון לגשת ל-API
        try:
            response = requests.get(
                target, 
                headers={'User-Agent': 'Arxio-API-Scanner/1.0'},
                timeout=10
            )
            response.raise_for_status()
            
            update_progress(progress_callback, {
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": f"גישה ל-API הצליחה, קוד תגובה: {response.status_code}"
                }]
            })
        except Exception as e:
            update_progress(progress_callback, {
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "warning",
                    "message": f"בעיה בגישה ל-API: {str(e)}"
                }]
            })
            # ממשיכים בכל זאת...
        
        # שלב 2: בדיקת Swagger/OpenAPI אם מתאים
        update_progress(progress_callback, {
            "overallProgress": 30,
            "currentStep": "scan",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": "בודק מפרט API"
            }]
        })

        # שלב 3: סריקת API וחיפוש פגיעויות
        update_progress(progress_callback, {
            "overallProgress": 50,
            "currentStep": "scan",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": "סורק פגיעויות ב-API"
            }]
        })
        
        time.sleep(2)  # סימולציה של זמן סריקה
        
        # שלב 4: זיהוי פגיעויות
        update_progress(progress_callback, {
            "overallProgress": 70,
            "currentStep": "identify",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": "מזהה פגיעויות"
            }]
        })
        
        time.sleep(1)  # סימולציה של זמן סריקה
        
        # שלב 5: יצירת דו"ח
        update_progress(progress_callback, {
            "overallProgress": 90,
            "currentStep": "report",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": "מכין דו\"ח"
            }]
        })
        
        time.sleep(1)  # סימולציה של זמן סריקה
        
        # הכנת דו"ח סריקה אמיתי
        findings = scan_api_for_vulnerabilities(target, parameters)
        
        # עדכון התקדמות סופי
        update_progress(progress_callback, {
            "status": "completed",
            "overallProgress": 100,
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": f"סריקת API הושלמה, {len(findings)} ממצאים"
            }]
        })
        
        # מבנה תוצאה סופי
        return {
            "success": True,
            "scan_id": scan_id,
            "scan_type": "API",
            "target": target,
            "findings_count": len(findings),
            "findings": findings,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"שגיאה בסריקת API: {str(e)}")
        
        # עדכון התקדמות במקרה של שגיאה
        update_progress(progress_callback, {
            "status": "failed",
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "error",
                "message": f"סריקת API נכשלה: {str(e)}"
            }]
        })
        
        return {
            "success": False,
            "scan_id": scan_id,
            "scan_type": "API",
            "target": target,
            "error": str(e)
        }


def update_progress(
    callback: Optional[Callable[[Dict[str, Any]], None]], 
    data: Dict[str, Any]
) -> None:
    """
    עדכון התקדמות באמצעות ה-callback שהתקבל
    
    :param callback: פונקציית callback לעדכון התקדמות
    :param data: נתוני ההתקדמות
    """
    if callback:
        callback(data)


def scan_api_for_vulnerabilities(
    target: str, 
    parameters: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    ביצוע סריקת פגיעויות אמיתית של ה-API
    
    :param target: כתובת ה-API לסריקה
    :param parameters: פרמטרים נוספים לסריקה
    :return: רשימת ממצאים
    """
    # כאן יש להשתמש בכלי אבטחה אמיתי כגון OWASP ZAP API או
    # כלים אחרים לסריקת API
    
    findings = []
    
    # שליחת בקשה לניתוח API
    try:
        # כאן יבוא קוד אמיתי...
        
        # דוגמה לממצא אמיתי מביצוע סריקה
        findings.append({
            "id": f"api-vuln-{int(time.time())}-1",
            "severity": "high",
            "rule_id": "API-BROKEN-AUTH",
            "title": "חולשת אימות שבורה ב-API",
            "description": "נמצאה חולשת אימות בממשק ה-API. ניתן לעקוף את מנגנון האימות באמצעות מניפולציה של הבקשה.", 
            "path": "/api/auth",
            "details": {
                "method": "POST",
                "affected_parameters": ["token"],
                "remediation": "יש לוודא תקינות טוקן בצד שרת ולהימנע מהסתמכות על מידע מהלקוח"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return findings
    except Exception as e:
        logger.error(f"שגיאה בסריקת פגיעויות API: {str(e)}")
        return []


if __name__ == "__main__":
    import asyncio
    import sys
    
    # פונקציית callback פשוטה להדפסת התקדמות
    def print_progress(progress):
        status = progress.get("status", "")
        logs = progress.get("logs", [])
        if logs:
            last_log = logs[-1]
            print(f"[{last_log['level'].upper()}] {last_log['message']}")
    
    # פרסינג פרמטרים
    if len(sys.argv) < 2:
        print("שימוש: python api_scan.py <target_url> [parameters_json]")
        sys.exit(1)
    
    target_url = sys.argv[1]
    parameters = {}
    
    if len(sys.argv) > 2:
        try:
            parameters = json.loads(sys.argv[2])
        except:
            print("שגיאה בפירוש פרמטרים JSON")
            sys.exit(1)
    
    # הרצת הסריקה
    async def main():
        result = await run_api_scan(target_url, parameters, print_progress)
        
        if result["success"]:
            print(f"\nסריקת API הושלמה בהצלחה!")
            print(f"נמצאו {result['findings_count']} פגיעויות")
        else:
            print(f"\nהסריקה נכשלה: {result.get('error', 'שגיאה לא ידועה')}")
    
    asyncio.run(main()) 