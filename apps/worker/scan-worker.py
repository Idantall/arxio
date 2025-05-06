#!/usr/bin/env python3
import os
import json
import time
import uuid
import logging
import requests
import redis
from datetime import datetime, timezone
from dotenv import load_dotenv

# טעינת משתני סביבה מקובץ .env
load_dotenv()

# קביעת רמת רישום לוג
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('scan-worker')

# הגדרת התחברות ל-Redis
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
WORKER_API_KEY = os.getenv('WORKER_API_KEY', 'dev-worker-key')

# יבוא מודולי סריקה
try:
    from scanners.dast import run_dast_scan, publish_progress as publish_dast_progress
    HAS_DAST = True
except ImportError:
    logger.warning("מודול DAST לא זמין")
    HAS_DAST = False

try:
    from scanners.sast import run_sast_scan, publish_progress as publish_sast_progress
    HAS_SAST = True
except ImportError:
    logger.warning("מודול SAST לא זמין")
    HAS_SAST = False

try:
    from scanners.api_scan import run_api_scan, publish_progress as publish_api_progress
    HAS_API_SCAN = True
except ImportError:
    logger.warning("מודול API לא זמין")
    HAS_API_SCAN = False

def get_initial_steps(scan_type):
    """מחזיר רשימה של צעדים לפי סוג הסריקה"""
    if scan_type == "SAST":
        return [
            {"id": "prepare", "label": "מכין סביבת עבודה", "status": "pending"},
            {"id": "clone", "label": "מוריד קוד מהמאגר", "status": "pending"},
            {"id": "analyze", "label": "מנתח קוד סטטי", "status": "pending"},
            {"id": "identify", "label": "מזהה פגיעויות", "status": "pending"},
            {"id": "report", "label": "מייצר דו״ח", "status": "pending"},
        ]
    elif scan_type == "DAST":
        return [
            {"id": "prepare", "label": "מכין סביבת עבודה", "status": "pending"}, 
            {"id": "scan", "label": "סורק את האתר", "status": "pending", "substeps": [
                {"id": "crawl", "label": "זחילה באתר", "status": "pending"},
                {"id": "active", "label": "סריקה אקטיבית", "status": "pending"}, 
                {"id": "passive", "label": "ניתוח פסיבי", "status": "pending"},
            ]},
            {"id": "identify", "label": "מזהה פגיעויות", "status": "pending"},
            {"id": "report", "label": "מייצר דו״ח", "status": "pending"},
        ]
    elif scan_type == "API":
        return [
            {"id": "prepare", "label": "מכין סביבת עבודה", "status": "pending"},
            {"id": "scan", "label": "סורק את ה-API", "status": "pending"},
            {"id": "identify", "label": "מזהה פגיעויות", "status": "pending"},
            {"id": "report", "label": "מייצר דו״ח", "status": "pending"},
        ]
    return []

class ScanWorker:
    def __init__(self):
        """אתחול עובד סריקה"""
        self.redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()
        self.pubsub.subscribe('scan:requests')
        logger.info("עובד סריקה הופעל וממתין לבקשות")
        
    def update_progress(self, scan_id, progress_data):
        """עדכון מידע על התקדמות הסריקה ב-Redis ובשרת ה-API"""
        try:
            # שמירה ב-Redis
            redis_key = f"scan:progress:{scan_id}"
            self.redis_client.set(redis_key, json.dumps(progress_data))
            
            # שליחה לשרת ה-API
            headers = {'x-api-key': WORKER_API_KEY, 'Content-Type': 'application/json'}
            requests.post(
                f"{API_BASE_URL}/scans/progress",
                headers=headers,
                json={'scanId': scan_id, 'progress': progress_data}
            )
            
            # פרסום הודעת עדכון ב-Redis
            self.redis_client.publish('scan:updates', json.stringify({
                'scanId': scan_id,
                'type': 'progress_update',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'data': progress_data
            }))
            
        except Exception as e:
            logger.error(f"שגיאה בעדכון התקדמות: {str(e)}")
    
    def update_scan_status(self, scan_id, status, error_message=None):
        """עדכון סטטוס סריקה במסד הנתונים"""
        try:
            headers = {'x-api-key': WORKER_API_KEY, 'Content-Type': 'application/json'}
            payload = {'scanId': scan_id, 'status': status}
            
            if error_message:
                payload['errorMessage'] = error_message
                
            requests.post(
                f"{API_BASE_URL}/scans/status",
                headers=headers,
                json=payload
            )
        except Exception as e:
            logger.error(f"שגיאה בעדכון סטטוס סריקה: {str(e)}")
    
    def run_scan(self, scan_id, scan_type, target, parameters=None):
        """הפעלת סריקה לפי סוג"""
        logger.info(f"מתחיל סריקה חדשה: {scan_id}, סוג: {scan_type}, מטרה: {target}")
        
        # יצירת מבנה התקדמות בסיסי
        progress_data = {
            "scanId": scan_id,
            "scanType": scan_type,
            "target": target,
            "overallProgress": 0,
            "startTime": datetime.now(timezone.utc).isoformat(),
            "estimatedTime": 30 if scan_type == "DAST" else 15 if scan_type == "SAST" else 20,
            "status": "initializing",
            "steps": get_initial_steps(scan_type),
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": f"התחלת סריקת {scan_type}"
            }]
        }
        
        # עדכון התקדמות ראשוני
        self.update_progress(scan_id, progress_data)
        
        try:
            # הפעלת הסריקה המתאימה לפי סוג
            if scan_type == "DAST" and HAS_DAST:
                # עדכון סטטוס לפני התחלת הסריקה
                self.update_scan_status(scan_id, "running")
                
                # קריאה לפונקציית הסריקה עם פונקציית callback לעדכוני התקדמות
                def progress_callback(progress_update):
                    # עדכון המבנה הכללי עם נתוני ההתקדמות החדשים
                    progress_data.update(progress_update)
                    self.update_progress(scan_id, progress_data)
                
                # הפעלת הסריקה
                result = run_dast_scan(target, parameters, progress_callback)
                
                # עדכון סטטוס בסיום
                if result.get('success', False):
                    self.update_scan_status(scan_id, "completed")
                    progress_data["status"] = "completed"
                    progress_data["overallProgress"] = 100
                else:
                    self.update_scan_status(scan_id, "failed", result.get('error'))
                    progress_data["status"] = "failed"
                    progress_data["error"] = result.get('error')
                
                # עדכון התקדמות סופי
                self.update_progress(scan_id, progress_data)
                
            elif scan_type == "SAST" and HAS_SAST:
                # דומה ל-DAST אבל עם הפונקציה המתאימה
                self.update_scan_status(scan_id, "running")
                
                def progress_callback(progress_update):
                    progress_data.update(progress_update)
                    self.update_progress(scan_id, progress_data)
                
                result = run_sast_scan(target, parameters, progress_callback)
                
                if result.get('success', False):
                    self.update_scan_status(scan_id, "completed")
                    progress_data["status"] = "completed"
                    progress_data["overallProgress"] = 100
                else:
                    self.update_scan_status(scan_id, "failed", result.get('error'))
                    progress_data["status"] = "failed"
                    progress_data["error"] = result.get('error')
                
                self.update_progress(scan_id, progress_data)
                
            elif scan_type == "API" and HAS_API_SCAN:
                # דומה ל-DAST אבל עם הפונקציה המתאימה
                self.update_scan_status(scan_id, "running")
                
                def progress_callback(progress_update):
                    progress_data.update(progress_update)
                    self.update_progress(scan_id, progress_data)
                
                result = run_api_scan(target, parameters, progress_callback)
                
                if result.get('success', False):
                    self.update_scan_status(scan_id, "completed")
                    progress_data["status"] = "completed"
                    progress_data["overallProgress"] = 100
                else:
                    self.update_scan_status(scan_id, "failed", result.get('error'))
                    progress_data["status"] = "failed"
                    progress_data["error"] = result.get('error')
                
                self.update_progress(scan_id, progress_data)
                
            else:
                # סוג סריקה לא נתמך
                error_msg = f"סוג סריקה {scan_type} אינו נתמך או שהמודול לא זמין"
                logger.error(error_msg)
                self.update_scan_status(scan_id, "failed", error_msg)
                
                progress_data["status"] = "failed"
                progress_data["error"] = error_msg
                progress_data["logs"].append({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "error",
                    "message": error_msg
                })
                self.update_progress(scan_id, progress_data)
                
        except Exception as e:
            # טיפול בשגיאות לא צפויות
            error_msg = f"שגיאה בביצוע הסריקה: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            
            self.update_scan_status(scan_id, "failed", error_msg)
            
            progress_data["status"] = "failed"
            progress_data["error"] = error_msg
            progress_data["logs"].append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "error",
                "message": error_msg
            })
            self.update_progress(scan_id, progress_data)
    
    def listen(self):
        """האזנה להודעות מ-Redis והפעלת סריקות בהתאם"""
        logger.info("מקשיב להודעות סריקה חדשות")
        
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                try:
                    data = json.loads(message['data'])
                    
                    if data.get('action') == 'start_scan':
                        scan_id = data.get('scanId')
                        scan_type = data.get('scanType')
                        target = data.get('target')
                        parameters = data.get('parameters', {})
                        
                        # הפעלת הסריקה בתהליך נפרד
                        import threading
                        threading.Thread(
                            target=self.run_scan,
                            args=(scan_id, scan_type, target, parameters)
                        ).start()
                    
                except json.JSONDecodeError:
                    logger.error(f"שגיאת JSON בהודעה: {message['data']}")
                except Exception as e:
                    logger.error(f"שגיאה בטיפול בהודעה: {str(e)}")

if __name__ == "__main__":
    # יצירת והפעלת עובד הסריקה
    worker = ScanWorker()
    
    try:
        worker.listen()
    except KeyboardInterrupt:
        logger.info("עובד הסריקה עוצר...")
    except Exception as e:
        logger.error(f"שגיאה לא צפויה: {str(e)}")
        
    logger.info("עובד הסריקה הסתיים") 