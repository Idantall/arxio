#!/usr/bin/env python3
"""
מודול לסריקה משולבת - הרצת סריקות אבטחה מרובות בו-זמנית

מודול זה מאפשר הרצת שילוב של סריקות SAST, DAST ו-API יחד,
תוך התחשבות ברמת המשתמש (חינמי, רגיל או ארגוני) והרשאות הגישה.

מיועד לפשט את תהליך הסריקה לפיתוחים חדשים ומתכנתים שאינם
מומחים באבטחת מידע, תוך שמירה על מגבלות השימוש לפי סוג המינוי.
"""

import os
import json
import time
import asyncio
import logging
import tempfile
import redis
from datetime import datetime, timezone
from typing import Dict, List, Any, Callable, Optional, Union
from concurrent.futures import ThreadPoolExecutor

# ייבוא מודולי הסריקה השונים
try:
    from scanners.sast import run_sast_scan
    from scanners.dast import run_dast_scan
    from scanners.api_scan import run_api_scan
except ImportError:
    # אם לא נמצאו מודולי הסריקה ישירות, ננסה לייבא באופן יחסי
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from sast import run_sast_scan
    from dast import run_dast_scan
    from api_scan import run_api_scan

# קביעת רמת רישום לוג
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('combined-scanner')

# קישור ל-Redis אם נדרש לפרסום עדכוני התקדמות
redis_client = None

def initialize_redis(redis_url: str = None):
    """אתחול חיבור ל-Redis"""
    global redis_client
    if not redis_client and redis_url:
        redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    return redis_client

def publish_progress(channel: str, data: Dict[str, Any]):
    """פרסום עדכוני התקדמות ל-Redis"""
    if redis_client:
        redis_client.publish(channel, json.dumps(data))

# הגדרות תוכניות המשתמש והמגבלות
USER_PLAN_LIMITS = {
    "free": {
        "allowed_scans": ["dast"],  # רק סריקת DAST בסיסית
        "max_scans_per_month": 5,
        "max_concurrent_scans": 1,
        "max_scan_duration": 600,  # 10 דקות
        "description": "תוכנית חינמית - מוגבל לסריקות DAST בסיסיות"
    },
    "pro": {
        "allowed_scans": ["dast", "sast", "api"],  # כל סוגי הסריקות
        "max_scans_per_month": 50,
        "max_concurrent_scans": 3,
        "max_scan_duration": 1800,  # 30 דקות
        "description": "תוכנית מקצועית - כולל סריקות SAST, DAST, ו-API"
    },
    "enterprise": {
        "allowed_scans": ["dast", "sast", "api"],  # כל סוגי הסריקות
        "max_scans_per_month": 0,  # ללא הגבלה
        "max_concurrent_scans": 10,
        "max_scan_duration": 7200,  # 2 שעות
        "description": "תוכנית ארגונית - ללא הגבלות משמעותיות"
    }
}

async def check_user_permissions(user_id: str, plan: str, scan_types: List[str], supabase_client=None) -> Dict[str, Any]:
    """
    בדיקת הרשאות המשתמש לסריקות המבוקשות

    :param user_id: מזהה המשתמש
    :param plan: תוכנית המשתמש (free/pro/enterprise)
    :param scan_types: סוגי הסריקות המבוקשות
    :param supabase_client: לקוח Supabase לבדיקת נתונים מהמסד
    :return: תוצאות בדיקת ההרשאות
    """
    # אימות רמת המשתמש
    if plan not in USER_PLAN_LIMITS:
        return {
            "allowed": False,
            "error": f"תוכנית לא מוכרת: {plan}",
            "details": "יש לבחור באחת מהתוכניות המוגדרות: free, pro, enterprise"
        }
    
    plan_limits = USER_PLAN_LIMITS[plan]
    
    # בדיקה שכל סוגי הסריקות המבוקשות מותרים עבור התוכנית
    for scan_type in scan_types:
        if scan_type not in plan_limits["allowed_scans"]:
            return {
                "allowed": False,
                "error": f"סריקת {scan_type} אינה זמינה בתוכנית {plan}",
                "details": f"התוכנית {plan} מאפשרת רק: {', '.join(plan_limits['allowed_scans'])}"
            }
    
    # בדיקת מספר הסריקות החודשיות (אם יש הגבלה)
    if plan_limits["max_scans_per_month"] > 0 and supabase_client:
        # כאן יש לממש לוגיקה לבדיקת מספר הסריקות שבוצעו החודש
        # לדוגמה:
        try:
            # קוד לדוגמה לבדיקת מכסת הסריקות מול Supabase
            current_month = datetime.now().strftime('%Y-%m')
            first_day = f"{current_month}-01T00:00:00Z"
            
            # בדיקת מספר הסריקות שבוצעו החודש
            query = f"""
            SELECT COUNT(*) 
            FROM scans 
            WHERE user_id = '{user_id}' 
            AND created_at >= '{first_day}'
            """
            
            # פשוט לדוגמה - צריך להתאים לפי המימוש האמיתי של ה-API של Supabase
            # result = await supabase_client.rpc('pgql', { 'query': query })
            # scans_count = result['data'][0]['count']
            
            # במקום זה, לצורך הדוגמה:
            scans_count = 0  # ערך ברירת מחדל
            
            if scans_count >= plan_limits["max_scans_per_month"]:
                return {
                    "allowed": False,
                    "error": "הגעת למגבלת הסריקות החודשית",
                    "details": f"תוכנית {plan} מוגבלת ל-{plan_limits['max_scans_per_month']} סריקות בחודש"
                }
        except Exception as e:
            logger.error(f"שגיאה בבדיקת מכסת הסריקות: {str(e)}")
            # במקרה של שגיאה נאפשר לסריקה להמשיך
    
    # בדיקות נוספות
    # כאן ניתן להוסיף בדיקות נוספות כמו מספר הסריקות המקבילות הפעילות כרגע
    
    return {
        "allowed": True,
        "plan": plan,
        "limits": plan_limits
    }

async def run_combined_scan(
    targets: Dict[str, str],
    user_id: str,
    plan: str = "free",
    parameters: Optional[Dict[str, Any]] = None,
    progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Dict[str, Any]:
    """
    הרצת סריקה משולבת של מספר סוגי סריקות

    :param targets: מילון כתובות/מטרות לפי סוג סריקה (sast, dast, api)
    :param user_id: מזהה המשתמש
    :param plan: סוג התוכנית של המשתמש (free/pro/enterprise)
    :param parameters: פרמטרים נוספים לסריקות
    :param progress_callback: פונקציה לעדכון התקדמות
    :return: תוצאות הסריקה המשולבת
    """
    start_time = datetime.now(timezone.utc)
    scan_id = parameters.get("scan_id", f"scan_{int(time.time())}")
    parameters = parameters or {}
    
    # עדכון התקדמות: התחלת סריקה
    if progress_callback:
        progress_callback({
            "scanId": scan_id,
            "overallProgress": 1,
            "status": "initializing",
            "steps": [
                {"id": "auth", "label": "בדיקת הרשאות", "status": "running"}
            ] + [
                {"id": scan_type, "label": f"סריקת {scan_type.upper()}", "status": "pending"} 
                for scan_type in targets.keys()
            ],
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": f"מתחיל סריקה משולבת עבור משתמש {user_id} בתוכנית {plan}"
            }]
        })
    
    try:
        # בדיקת הרשאות המשתמש
        scan_types = list(targets.keys())
        permissions = await check_user_permissions(user_id, plan, scan_types)
        
        if not permissions["allowed"]:
            if progress_callback:
                progress_callback({
                    "scanId": scan_id,
                    "status": "failed",
                    "logs": [{
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "level": "error",
                        "message": f"אין הרשאה לסריקה: {permissions['error']}"
                    }]
                })
            
            return {
                "success": False,
                "error": permissions['error'],
                "details": permissions.get('details', ''),
                "scan_duration": (datetime.now(timezone.utc) - start_time).total_seconds()
            }
        
        if progress_callback:
            progress_callback({
                "scanId": scan_id,
                "overallProgress": 5,
                "steps": [
                    {"id": "auth", "label": "בדיקת הרשאות", "status": "completed"}
                ] + [
                    {"id": scan_type, "label": f"סריקת {scan_type.upper()}", "status": "pending"} 
                    for scan_type in targets.keys()
                ],
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": f"הרשאות אושרו. מתחיל הרצת סריקות: {', '.join(scan_types)}"
                }]
            })
        
        # הכנת תוצאות הסריקה
        results = {
            "success": True,
            "scan_id": scan_id,
            "user_id": user_id,
            "plan": plan,
            "scan_start": start_time.isoformat(),
            "scan_types": scan_types,
            "results": {},
            "findings_summary": {
                "total": 0,
                "by_severity": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                },
                "by_scan_type": {}
            }
        }
        
        # הרצת הסריקות במקביל אם יש יותר מסריקה אחת
        async def run_scan(scan_type, target):
            scan_progress = 0
            
            # פונקציה להעברת עדכוני התקדמות מהסורק הספציפי
            def update_scan_progress(scan_data):
                nonlocal scan_progress
                
                if 'overallProgress' in scan_data:
                    # עדכון ההתקדמות הכללית
                    scan_progress = scan_data['overallProgress']
                    
                    # חישוב ההתקדמות הכללית של כל הסריקות יחד
                    if progress_callback:
                        # משקל כל סריקה הוא 95% / מספר הסריקות
                        # 5% הראשונים כבר הוקצו לבדיקת ההרשאות
                        weight_per_scan = 95.0 / len(scan_types)
                        scan_contribution = (scan_progress / 100.0) * weight_per_scan
                        
                        # חישוב ממוצע משוקלל של כל הסריקות + 5% ההתחלתיים
                        overall_progress = 5 + scan_contribution
                        
                        # עדכון שלב הסריקה הנוכחי
                        updated_steps = []
                        for step in results.get("steps", []):
                            if step["id"] == scan_type:
                                step["status"] = "running"
                                step["progress"] = scan_progress
                            updated_steps.append(step)
                        
                        scan_data["scanId"] = scan_id
                        scan_data["overallProgress"] = min(99, overall_progress)
                        scan_data["steps"] = updated_steps
                        
                        progress_callback(scan_data)
            
            try:
                # עדכון מצב הסריקה הנוכחית למצב "running"
                if progress_callback:
                    progress_callback({
                        "scanId": scan_id,
                        "logs": [{
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "level": "info",
                            "message": f"מתחיל סריקת {scan_type.upper()} עבור: {target}"
                        }]
                    })
                
                # הפעלת הסורק המתאים
                scan_result = None
                scan_parameters = parameters.get(scan_type, {})
                
                if scan_type == "sast":
                    scan_result = run_sast_scan(target, scan_parameters, update_scan_progress)
                elif scan_type == "dast":
                    scan_result = run_dast_scan(target, scan_parameters, update_scan_progress)
                elif scan_type == "api":
                    scan_result = run_api_scan(target, scan_parameters, update_scan_progress)
                
                return scan_type, scan_result
                
            except Exception as e:
                logger.error(f"שגיאה בהרצת סריקת {scan_type}: {str(e)}")
                return scan_type, {
                    "success": False,
                    "error": f"שגיאה בהרצת סריקת {scan_type}: {str(e)}",
                    "scan_duration": 0
                }
        
        # הרצת הסריקות
        scan_tasks = []
        
        for scan_type, target in targets.items():
            if not target:
                continue
                
            task = asyncio.create_task(run_scan(scan_type, target))
            scan_tasks.append(task)
        
        # המתנה לסיום כל הסריקות
        scan_results = await asyncio.gather(*scan_tasks)
        
        # עיבוד תוצאות הסריקות
        total_findings = 0
        
        for scan_type, result in scan_results:
            # הוספת תוצאות הסריקה לתוצאות המשולבות
            results["results"][scan_type] = result
            
            # עדכון סיכום הממצאים
            if result.get("success", False):
                findings_count = 0
                
                # חישוב מספר הממצאים הכולל
                if "findings" in result:
                    findings_count = len(result["findings"])
                elif "findings_summary" in result:
                    findings_count = result["findings_summary"].get("total", 0)
                
                # עדכון מספר הממצאים לפי סוג סריקה
                results["findings_summary"]["by_scan_type"][scan_type] = findings_count
                total_findings += findings_count
                
                # עדכון מספר הממצאים לפי חומרה
                if "findings_summary" in result and "by_severity" in result["findings_summary"]:
                    for severity, count in result["findings_summary"]["by_severity"].items():
                        if severity in results["findings_summary"]["by_severity"]:
                            results["findings_summary"]["by_severity"][severity] += count
            else:
                # אם הסריקה נכשלה
                results["findings_summary"]["by_scan_type"][scan_type] = 0
                
                if progress_callback:
                    progress_callback({
                        "scanId": scan_id,
                        "logs": [{
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "level": "error",
                            "message": f"סריקת {scan_type.upper()} נכשלה: {result.get('error', 'שגיאה לא ידועה')}"
                        }]
                    })
        
        # עדכון סיכום כולל
        results["findings_summary"]["total"] = total_findings
        
        # חישוב משך זמן הסריקה
        end_time = datetime.now(timezone.utc)
        scan_duration = (end_time - start_time).total_seconds()
        results["scan_end"] = end_time.isoformat()
        results["scan_duration"] = scan_duration
        
        # עדכון סופי
        if progress_callback:
            progress_callback({
                "scanId": scan_id,
                "overallProgress": 100,
                "status": "completed",
                "steps": [
                    {"id": "auth", "label": "בדיקת הרשאות", "status": "completed"}
                ] + [
                    {"id": scan_type, "label": f"סריקת {scan_type.upper()}", 
                     "status": "completed" if results["results"].get(scan_type, {}).get("success", False) else "failed"} 
                    for scan_type in targets.keys()
                ],
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": f"סריקה משולבת הושלמה. נמצאו {total_findings} ממצאים. משך הסריקה: {scan_duration:.1f} שניות"
                }]
            })
        
        return results
        
    except Exception as e:
        logger.error(f"שגיאה בסריקה המשולבת: {str(e)}")
        
        if progress_callback:
            progress_callback({
                "scanId": scan_id,
                "status": "failed",
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "error",
                    "message": f"הסריקה נכשלה: {str(e)}"
                }]
            })
        
        return {
            "success": False,
            "error": str(e),
            "scan_duration": (datetime.now(timezone.utc) - start_time).total_seconds()
        }

async def update_user_plan(user_id: str, new_plan: str, supabase_client=None) -> Dict[str, Any]:
    """
    עדכון תוכנית המשתמש בטבלת המשתמשים ב-Supabase

    :param user_id: מזהה המשתמש
    :param new_plan: התוכנית החדשה
    :param supabase_client: לקוח Supabase
    :return: תוצאות העדכון
    """
    if not supabase_client:
        return {
            "success": False,
            "error": "לא סופק לקוח Supabase",
            "user_id": user_id
        }
    
    if new_plan not in USER_PLAN_LIMITS:
        return {
            "success": False,
            "error": f"תוכנית לא חוקית: {new_plan}",
            "valid_plans": list(USER_PLAN_LIMITS.keys())
        }
    
    try:
        # קוד לדוגמה לעדכון תוכנית משתמש בטבלת users ב-Supabase
        update_query = f"""
        UPDATE users 
        SET plan = '{new_plan}', updated_at = NOW() 
        WHERE id = '{user_id}'
        """
        
        # עדכון באמצעות Supabase API
        try:
            if supabase_client:
                result = await supabase_client.rpc('pgql', { 'query': update_query })
                return {
                    "success": True,
                    "message": f"תוכנית המשתמש עודכנה ל-{new_plan}",
                    "user_id": user_id,
                    "plan": new_plan,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            else:
                raise ValueError("לא ניתן להשתמש ב-Supabase Client")
        except Exception as e:
            logger.error(f"שגיאה בעדכון תוכנית משתמש באמצעות Supabase: {str(e)}")
            raise e
    except Exception as e:
        logger.error(f"שגיאה בעדכון תוכנית משתמש: {str(e)}")
        return {
            "success": False,
            "error": f"שגיאה בעדכון תוכנית המשתמש: {str(e)}",
            "user_id": user_id
        }

async def setup_user_plan_field(supabase_client=None) -> Dict[str, Any]:
    """
    הוספת עמודת plan לטבלת המשתמשים אם היא לא קיימת
    
    :param supabase_client: לקוח Supabase
    :return: תוצאות הפעולה
    """
    if not supabase_client:
        return {
            "success": False,
            "error": "לא סופק לקוח Supabase"
        }
    
    try:
        # קוד לדוגמה להוספת עמודת plan לטבלת users
        add_column_query = """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'plan'
            ) THEN
                ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT 'free' NOT NULL;
                
                -- יצירת אינדקס לחיפוש מהיר
                CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
                
                -- עדכון כל המשתמשים הקיימים לתוכנית חינמית כברירת מחדל
                UPDATE users SET plan = 'free' WHERE plan IS NULL;
            END IF;
        END
        $$;
        """
        
        # שימוש ב-Supabase API
        try:
            if supabase_client:
                result = await supabase_client.rpc('pgql', { 'query': add_column_query })
                return {
                    "success": True,
                    "message": "עמודת plan נוספה/קיימת בטבלת המשתמשים",
                    "query": add_column_query
                }
            else:
                raise ValueError("לא ניתן להשתמש ב-Supabase Client")
        except Exception as e:
            logger.error(f"שגיאה בהוספת עמודת plan באמצעות Supabase: {str(e)}")
            raise e
    except Exception as e:
        logger.error(f"שגיאה בהוספת עמודת plan: {str(e)}")
        return {
            "success": False,
            "error": f"שגיאה בהוספת עמודת plan: {str(e)}"
        }

if __name__ == "__main__":
    # דוגמה לשימוש ישיר במודול
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description='הרצת סריקה משולבת')
    parser.add_argument('--user', required=True, help='מזהה המשתמש')
    parser.add_argument('--plan', default='free', choices=['free', 'pro', 'enterprise'], help='תוכנית המשתמש')
    parser.add_argument('--sast', help='יעד סריקת SAST (למשל כתובת Git)')
    parser.add_argument('--dast', help='יעד סריקת DAST (למשל כתובת אתר)')
    parser.add_argument('--api', help='יעד סריקת API (למשל Swagger URL)')
    
    args = parser.parse_args()
    
    # יצירת מילון של יעדים לסריקה
    targets = {}
    if args.sast:
        targets['sast'] = args.sast
    if args.dast:
        targets['dast'] = args.dast
    if args.api:
        targets['api'] = args.api
    
    if not targets:
        print("יש לציין לפחות יעד סריקה אחד (--sast, --dast, או --api)")
        sys.exit(1)
    
    def print_progress(progress):
        status = progress.get("status", "")
        logs = progress.get("logs", [])
        if logs:
            last_log = logs[-1]
            print(f"[{last_log['level'].upper()}] {last_log['message']}")
    
    # הרצת הסריקה המשולבת
    async def main():
        result = await run_combined_scan(
            targets=targets,
            user_id=args.user,
            plan=args.plan,
            progress_callback=print_progress
        )
        
        if result["success"]:
            print(f"\nסריקה הושלמה בהצלחה!")
            print(f"סך הכל ממצאים: {result['findings_summary']['total']}")
            
            print("\nממצאים לפי חומרה:")
            for severity, count in result['findings_summary']['by_severity'].items():
                if count > 0:
                    print(f"  {severity}: {count}")
            
            print("\nממצאים לפי סוג סריקה:")
            for scan_type, count in result['findings_summary']['by_scan_type'].items():
                print(f"  {scan_type}: {count}")
        else:
            print(f"\nהסריקה נכשלה: {result.get('error', 'שגיאה לא ידועה')}")
    
    # הרצת הפונקציה האסינכרונית
    asyncio.run(main()) 