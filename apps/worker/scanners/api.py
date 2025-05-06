#!/usr/bin/env python3
"""
API Security Scanner
סורק אבטחה עבור ממשקי API - בודק חולשות אבטחה בממשקי API מבוססי REST ו-GraphQL
"""

import os
import json
import time
import logging
import redis
import requests
from subprocess import Popen, PIPE
import shlex
import uuid
import re

# הגדרת רמת הלוג
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-scanner")

# חיבור לרדיס
def init_redis():
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    try:
        client = redis.from_url(redis_url)
        logger.info(f"התחברות לרדיס הצליחה: {redis_url}")
        return client
    except Exception as e:
        logger.error(f"שגיאה בהתחברות לרדיס: {e}")
        return None

redis_client = init_redis()

# מיפוי חומרה עבור סוגי הממצאים השונים
SEVERITY_MAPPING = {
    'critical': 'CRITICAL',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
    'info': 'INFO',
    
    # מיפוי עבור כלים ספציפיים
    'Critical': 'CRITICAL',
    'High': 'HIGH',
    'Medium': 'MEDIUM',
    'Low': 'LOW',
    'Info': 'INFO',
    'Information': 'INFO'
}

def print_progress(scan_id, message, progress=None):
    """עדכון התקדמות הסריקה"""
    if redis_client:
        progress_key = f"scan:progress:{scan_id}"
        try:
            # קריאת המידע הקיים
            current_data = redis_client.get(progress_key)
            if current_data:
                progress_data = json.loads(current_data)
            else:
                # במקרה שאין מידע קיים
                progress_data = {
                    "scanId": scan_id,
                    "status": "running",
                    "steps": [],
                    "overallProgress": 0,
                    "logs": []
                }
            
            # הוספת לוג חדש
            timestamp = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
            progress_data["logs"].append({
                "timestamp": timestamp,
                "level": "info",
                "message": message
            })
            
            # עדכון התקדמות
            if progress is not None:
                progress_data["overallProgress"] = progress
            
            # שמירת הנתונים המעודכנים
            redis_client.set(progress_key, json.dumps(progress_data))
            logger.info(f"[{scan_id}] {message} - התקדמות: {progress}")
        except Exception as e:
            logger.error(f"שגיאה בעדכון התקדמות: {e}")
    else:
        logger.info(f"[{scan_id}] {message} - התקדמות: {progress}")

def validate_api_url(url):
    """בדיקת תקינות כתובת ה-API"""
    if not url or not re.match(r'^https?://', url):
        return False, "כתובת API לא תקינה. נדרשת כתובת URL מלאה (עם http:// או https://)"
    
    try:
        # בדיקה שהשרת מגיב
        response = requests.head(url, timeout=10)
        return True, None
    except requests.exceptions.RequestException as e:
        return False, f"לא ניתן לגשת לכתובת ה-API: {str(e)}"

def run_api_scan_with_schemathesis(scan_id, api_url, parameters=None):
    """הרצת סריקת API באמצעות Schemathesis"""
    print_progress(scan_id, f"התחלת סריקת API עם Schemathesis: {api_url}", 10)
    
    # בדיקת תקינות ה-URL
    valid, error_message = validate_api_url(api_url)
    if not valid:
        print_progress(scan_id, f"שגיאה: {error_message}", 0)
        return {"status": "error", "message": error_message}
    
    # יצירת תיקייה זמנית לתוצאות
    temp_dir = f"/tmp/api-scan-{uuid.uuid4()}"
    os.makedirs(temp_dir, exist_ok=True)
    output_file = f"{temp_dir}/schemathesis-report.json"
    
    try:
        # בניית פקודת הסריקה
        command = f"schemathesis run --report=json --output={output_file} {api_url}"
        if parameters and parameters.get('auth_header'):
            auth_header = parameters.get('auth_header')
            command += f' --header="Authorization: {auth_header}"'
        
        print_progress(scan_id, f"מריץ פקודה: {command}", 20)
        
        # הרצת הסריקה
        process = Popen(shlex.split(command), stdout=PIPE, stderr=PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print_progress(scan_id, f"שגיאה בהרצת Schemathesis: {stderr.decode()}", 30)
            return {"status": "error", "message": stderr.decode()}
        
        # קריאת תוצאות הסריקה
        print_progress(scan_id, "מעבד תוצאות סריקה...", 70)
        
        if os.path.exists(output_file):
            with open(output_file, 'r') as f:
                results = json.load(f)
                
            # המרת התוצאות לפורמט אחיד
            findings = parse_schemathesis_results(results, api_url)
            
            print_progress(scan_id, f"נמצאו {len(findings)} ממצאים", 90)
            return {"status": "success", "findings": findings}
        else:
            print_progress(scan_id, "לא נמצאו תוצאות סריקה", 80)
            return {"status": "warning", "message": "לא נמצאו תוצאות סריקה"}
    
    except Exception as e:
        print_progress(scan_id, f"שגיאה בסריקת API: {str(e)}", 30)
        return {"status": "error", "message": str(e)}
    finally:
        # ניקוי קבצים זמניים
        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except:
            pass

def parse_schemathesis_results(results, api_url):
    """המרת תוצאות הסריקה לפורמט אחיד"""
    findings = []
    
    if 'errors' in results:
        for error in results['errors']:
            severity = 'MEDIUM'  # ברירת מחדל
            
            if 'security' in error.get('message', '').lower():
                severity = 'HIGH'
            elif 'schema' in error.get('message', '').lower():
                severity = 'MEDIUM'
            
            findings.append({
                'ruleId': 'schema-validation-error',
                'severity': severity,
                'title': 'שגיאת תיקוף סכמה',
                'description': error.get('message', 'שגיאת סכמה כללית'),
                'url': api_url
            })
    
    if 'results' in results:
        for endpoint, endpoint_results in results.get('results', {}).items():
            for method, method_results in endpoint_results.items():
                for test_result in method_results.get('failures', []):
                    finding = {
                        'ruleId': f"api-test-{test_result.get('name', 'unknown')}",
                        'severity': 'MEDIUM',  # ברירת מחדל
                        'title': f"בדיקת API נכשלה: {test_result.get('name', 'unknown')}",
                        'description': test_result.get('message', 'שגיאה לא ידועה'),
                        'url': f"{api_url}{endpoint}"
                    }
                    
                    # קביעת חומרה על פי תוכן השגיאה
                    message = test_result.get('message', '').lower()
                    if any(sec_term in message for sec_term in ['injection', 'xss', 'csrf', 'security', 'auth']):
                        finding['severity'] = 'HIGH'
                    elif any(sec_term in message for sec_term in ['validation', 'schema', 'type']):
                        finding['severity'] = 'MEDIUM'
                    
                    findings.append(finding)
    
    return findings

def run_api_scan(scan_id, api_url, parameters=None):
    """
    פונקציה ראשית להרצת סריקת API
    scan_id: מזהה הסריקה
    api_url: כתובת ה-API לסריקה
    parameters: פרמטרים נוספים (auth header, etc)
    """
    print_progress(scan_id, f"מתחיל סריקת API עבור {api_url}", 5)
    
    # יישום סריקה באמצעות Schemathesis
    schemathesis_results = run_api_scan_with_schemathesis(scan_id, api_url, parameters)
    
    # ניתן להוסיף כאן כלים נוספים, למשל:
    # 1. בדיקת OWASP API Top 10
    # 2. בדיקות אימות וזיהוי
    # 3. בדיקות הזרקה
    
    # שילוב התוצאות מכל הכלים
    all_findings = []
    
    if schemathesis_results.get('status') == 'success':
        all_findings.extend(schemathesis_results.get('findings', []))
    
    # שליחת התוצאות לשרת
    print_progress(scan_id, f"סריקת API הסתיימה. נמצאו {len(all_findings)} ממצאים", 100)
    
    # פרסום התוצאות
    if redis_client:
        try:
            # שמירת הממצאים במסד נתונים או שליחה למערכת אחרת ניתן להוסיף כאן
            
            # עדכון סטטוס הסריקה
            progress_key = f"scan:progress:{scan_id}"
            current_data = redis_client.get(progress_key)
            if current_data:
                progress_data = json.loads(current_data)
                progress_data["status"] = "completed"
                progress_data["overallProgress"] = 100
                progress_data["findings"] = len(all_findings)
                progress_data["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
                redis_client.set(progress_key, json.dumps(progress_data))
            
            # פרסום הודעה על סיום הסריקה
            scan_result = {
                "scanId": scan_id,
                "status": "completed",
                "findings": all_findings
            }
            redis_client.publish("scan:results", json.dumps(scan_result))
            
            logger.info(f"[{scan_id}] התוצאות פורסמו בהצלחה")
        except Exception as e:
            logger.error(f"[{scan_id}] שגיאה בפרסום תוצאות: {e}")
    
    return {"status": "success", "findings": all_findings}

def listen_for_api_scan_requests():
    """האזנה לבקשות סריקת API חדשות"""
    logger.info("מאזין לבקשות סריקת API חדשות...")
    
    if not redis_client:
        logger.error("אין חיבור לרדיס, לא ניתן להאזין לבקשות")
        return
    
    # הרשמה לערוץ הודעות
    pubsub = redis_client.pubsub()
    pubsub.subscribe("scan:requests")
    
    # לולאת האזנה להודעות
    for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = json.loads(message['data'])
                logger.info(f"התקבלה בקשה: {data}")
                
                # בדיקה שזו בקשה לסריקת API
                if data.get('action') == 'start_scan' and data.get('scanType') == 'API':
                    scan_id = data.get('scanId')
                    target = data.get('target')
                    parameters = data.get('parameters', {})
                    
                    if scan_id and target:
                        logger.info(f"מתחיל סריקת API חדשה: {scan_id} - {target}")
                        # הפעלת הסריקה בתהליך נפרד
                        import threading
                        threading.Thread(
                            target=run_api_scan,
                            args=(scan_id, target, parameters)
                        ).start()
            except Exception as e:
                logger.error(f"שגיאה בעיבוד בקשת סריקה: {e}")

if __name__ == "__main__":
    # הפעלת האזנה לבקשות סריקה חדשות
    listen_for_api_scan_requests() 