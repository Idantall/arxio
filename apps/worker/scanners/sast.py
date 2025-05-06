#!/usr/bin/env python3
"""
מודול סריקת SAST - ניתוח קוד סטטי לאיתור פגיעויות אבטחה

מודול זה מספק יכולת סריקת SAST (Static Application Security Testing)
שבודקת את הקוד המקור של אפליקציה לאיתור בעיות אבטחה ללא הרצת הקוד.

הסריקה בודקת דפוסי קוד בעייתיים, שימוש בפונקציות מסוכנות, ומנתחת
את זרימת המידע כדי לזהות נקודות תורפה כמו SQL Injection, XSS,
בעיות ניהול סיסמאות, וכדומה.
"""

import os
import re
import json
import time
import logging
import tempfile
import subprocess
import redis
from datetime import datetime, timezone
from git import Repo
from typing import Dict, List, Any, Callable, Optional

# קביעת רמת רישום לוג
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('sast-scanner')

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

# כלי סריקה פתוחים שנתמכים
SUPPORTED_SCANNERS = {
    "bandit": {
        "cmd": "bandit",
        "extensions": [".py"],
        "languages": ["python"],
        "scan_cmd": lambda target_dir: ["bandit", "-r", target_dir, "-f", "json", "-o", f"{target_dir}/bandit_results.json"]
    },
    "semgrep": {
        "cmd": "semgrep",
        "extensions": [".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".java", ".php"],
        "languages": ["python", "javascript", "typescript", "go", "java", "php"],
        "scan_cmd": lambda target_dir: ["semgrep", "--config", "auto", "--json", "-o", f"{target_dir}/semgrep_results.json", target_dir]
    },
    "eslint": {
        "cmd": "eslint",
        "extensions": [".js", ".jsx", ".ts", ".tsx"],
        "languages": ["javascript", "typescript"],
        "scan_cmd": lambda target_dir: ["eslint", "-c", ".eslintrc.js", "--format", "json", "-o", f"{target_dir}/eslint_results.json", target_dir]
    },
    "phpcs": {
        "cmd": "phpcs",
        "extensions": [".php"],
        "languages": ["php"],
        "scan_cmd": lambda target_dir: ["phpcs", "--standard=PSR2", "--report=json", f"{target_dir}", "-o", f"{target_dir}/phpcs_results.json"]
    }
}

# מיפוי רמות חומרה בין כלים שונים למודל האחיד שלנו
SEVERITY_MAPPING = {
    "bandit": {
        "HIGH": "high",
        "MEDIUM": "medium",
        "LOW": "low"
    },
    "semgrep": {
        "ERROR": "high",
        "WARNING": "medium",
        "INFO": "low"
    },
    "eslint": {
        "2": "high",  # error
        "1": "medium",  # warning
        "0": "low"     # info
    },
    "phpcs": {
        "ERROR": "high",
        "WARNING": "medium",
        "INFO": "low"
    }
}

def clone_repository(repo_url: str, branch: str = "main") -> str:
    """
    מוריד את קוד המקור מה-repo המבוקש ומחזיר נתיב לתיקייה המקומית
    """
    logger.info(f"מוריד קוד מהמאגר: {repo_url}, ענף: {branch}")
    temp_dir = tempfile.mkdtemp(prefix="sast_scan_")
    
    try:
        repo = Repo.clone_from(repo_url, temp_dir, branch=branch)
        logger.info(f"הקוד הורד בהצלחה לתיקייה: {temp_dir}")
        return temp_dir
    except Exception as e:
        logger.error(f"שגיאה בהורדת הקוד: {str(e)}")
        raise

def detect_language(target_dir: str) -> List[str]:
    """
    זיהוי שפות תכנות בפרויקט לפי סוגי קבצים
    """
    language_extensions = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".go": "go",
        ".java": "java",
        ".php": "php",
        ".rb": "ruby",
        ".c": "c",
        ".cpp": "cpp",
        ".cs": "csharp",
        ".swift": "swift",
        ".kt": "kotlin"
    }
    
    languages = set()
    
    for root, _, files in os.walk(target_dir):
        for file in files:
            _, ext = os.path.splitext(file)
            if ext in language_extensions:
                languages.add(language_extensions[ext])
    
    return list(languages)

def select_scanners(languages: List[str]) -> List[str]:
    """
    בחירת כלי סריקה מתאימים לפי שפות שזוהו
    """
    selected = []
    
    for scanner, info in SUPPORTED_SCANNERS.items():
        if any(lang in info["languages"] for lang in languages):
            # בדיקה אם הכלי מותקן
            try:
                subprocess.run([info["cmd"], "--version"], 
                               stdout=subprocess.DEVNULL, 
                               stderr=subprocess.DEVNULL, 
                               check=True)
                selected.append(scanner)
            except (subprocess.SubprocessError, FileNotFoundError):
                logger.warning(f"כלי הסריקה {scanner} לא מותקן, דלג על סריקה זו")
    
    return selected

def run_scanner(scanner: str, target_dir: str) -> Dict[str, Any]:
    """
    הרצת כלי סריקה ספציפי והחזרת התוצאות
    """
    logger.info(f"מריץ סריקת {scanner} על התיקייה {target_dir}")
    scanner_info = SUPPORTED_SCANNERS[scanner]
    cmd = scanner_info["scan_cmd"](target_dir)
    
    try:
        # מריץ את הסורק
        process = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=False  # לא לזרוק שגיאה אם הסורק מוצא בעיות
        )
        
        # בדיקה אם קובץ התוצאות נוצר
        results_file = f"{target_dir}/{scanner}_results.json"
        if os.path.exists(results_file):
            with open(results_file, 'r') as f:
                results = json.load(f)
            return {"success": True, "data": results}
        else:
            # ניסיון לקרוא את הפלט ישירות
            try:
                results = json.loads(process.stdout)
                return {"success": True, "data": results}
            except:
                return {
                    "success": False, 
                    "error": f"לא ניתן לקרוא תוצאות מהסורק {scanner}", 
                    "stdout": process.stdout,
                    "stderr": process.stderr
                }
    except Exception as e:
        logger.error(f"שגיאה בהרצת סריקת {scanner}: {str(e)}")
        return {"success": False, "error": str(e)}

def normalize_findings(scanner: str, raw_results: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    הסבת תוצאות גולמיות למבנה אחיד של ממצאים
    """
    findings = []
    
    if scanner == "bandit":
        for result in raw_results.get("results", []):
            findings.append({
                "title": result.get("test_name", "Unknown Issue"),
                "description": result.get("issue_text", ""),
                "severity": SEVERITY_MAPPING["bandit"].get(result.get("issue_severity", "MEDIUM"), "medium"),
                "location": f"{result.get('filename')}:{result.get('line_number')}",
                "code": result.get("code", ""),
                "cwe": result.get("cwe", {}).get("id") if isinstance(result.get("cwe"), dict) else None,
                "remediation": result.get("remediation", "")
            })
    
    elif scanner == "semgrep":
        for result in raw_results.get("results", []):
            findings.append({
                "title": result.get("check_id", "Unknown Issue"),
                "description": result.get("extra", {}).get("message", ""),
                "severity": SEVERITY_MAPPING["semgrep"].get(result.get("severity", "WARNING"), "medium"),
                "location": f"{result.get('path')}:{result.get('start', {}).get('line')}",
                "code": result.get("extra", {}).get("lines", ""),
                "cwe": None,  # Semgrep doesn't provide CWE directly
                "remediation": result.get("extra", {}).get("fix", "")
            })
    
    elif scanner == "eslint":
        for file_result in raw_results:
            for message in file_result.get("messages", []):
                findings.append({
                    "title": message.get("ruleId", "Unknown Issue"),
                    "description": message.get("message", ""),
                    "severity": SEVERITY_MAPPING["eslint"].get(str(message.get("severity", 1)), "medium"),
                    "location": f"{file_result.get('filePath')}:{message.get('line')}:{message.get('column')}",
                    "code": "",  # ESLint doesn't provide the code snippet directly
                    "cwe": None,
                    "remediation": ""
                })
    
    elif scanner == "phpcs":
        for file_path, file_data in raw_results.get("files", {}).items():
            for message in file_data.get("messages", []):
                findings.append({
                    "title": message.get("source", "Unknown Issue"),
                    "description": message.get("message", ""),
                    "severity": SEVERITY_MAPPING["phpcs"].get(message.get("type", "WARNING"), "medium"),
                    "location": f"{file_path}:{message.get('line')}:{message.get('column')}",
                    "code": "",
                    "cwe": None,
                    "remediation": ""
                })
    
    return findings

def run_sast_scan(
    target: str, 
    parameters: Optional[Dict[str, Any]] = None, 
    progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Dict[str, Any]:
    """
    פונקציה ראשית להרצת סריקת SAST
    
    :param target: כתובת ה-repo או תיקייה מקומית לסריקה
    :param parameters: פרמטרים נוספים לסריקה (ענף, שפות לסריקה, וכו')
    :param progress_callback: פונקציה לעדכון התקדמות
    :return: תוצאות הסריקה
    """
    start_time = datetime.now(timezone.utc)
    parameters = parameters or {}
    branch = parameters.get("branch", "main")
    
    # עדכון התקדמות: התחלת סריקה
    if progress_callback:
        progress_callback({
            "overallProgress": 5,
            "status": "initializing",
            "steps": [
                {"id": "prepare", "label": "מכין סביבת עבודה", "status": "running"}
            ] + [
                {"id": step_id, "label": label, "status": "pending"} 
                for step_id, label in [
                    ("clone", "מוריד קוד מהמאגר"),
                    ("analyze", "מנתח קוד סטטי"),
                    ("identify", "מזהה פגיעויות"),
                    ("report", "מייצר דו״ח")
                ]
            ],
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "message": f"מתחיל סריקת SAST על {target}"
            }]
        })
    
    try:
        # שלב 1: הורדת הקוד אם מדובר ב-repo
        target_dir = target
        if target.startswith(("http://", "https://", "git@")):
            # עדכון התקדמות: מוריד קוד
            if progress_callback:
                progress_callback({
                    "overallProgress": 10,
                    "status": "cloning",
                    "steps": [
                        {"id": "prepare", "label": "מכין סביבת עבודה", "status": "completed"},
                        {"id": "clone", "label": "מוריד קוד מהמאגר", "status": "running"}
                    ] + [
                        {"id": step_id, "label": label, "status": "pending"} 
                        for step_id, label in [
                            ("analyze", "מנתח קוד סטטי"),
                            ("identify", "מזהה פגיעויות"),
                            ("report", "מייצר דו״ח")
                        ]
                    ],
                    "logs": [{
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "level": "info",
                        "message": f"מוריד קוד מהמאגר {target}, ענף {branch}"
                    }]
                })
            
            target_dir = clone_repository(target, branch)
        
        # שלב 2: זיהוי שפות
        if progress_callback:
            progress_callback({
                "overallProgress": 20,
                "status": "analyzing",
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": "מזהה שפות תכנות בפרויקט"
                }]
            })
        
        languages = detect_language(target_dir)
        
        if not languages:
            return {
                "success": False,
                "error": "לא זוהו שפות תכנות נתמכות בפרויקט",
                "scan_duration": (datetime.now(timezone.utc) - start_time).total_seconds()
            }
        
        if progress_callback:
            progress_callback({
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": f"שפות שזוהו: {', '.join(languages)}"
                }]
            })
        
        # שלב 3: בחירת כלי סריקה
        scanners = select_scanners(languages)
        
        if not scanners:
            return {
                "success": False,
                "error": "לא נמצאו כלי סריקה מתאימים לשפות שזוהו",
                "scan_duration": (datetime.now(timezone.utc) - start_time).total_seconds()
            }
        
        if progress_callback:
            progress_callback({
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": f"כלי סריקה נבחרים: {', '.join(scanners)}"
                }]
            })
        
        # שלב 4: ביצוע סריקות
        if progress_callback:
            progress_callback({
                "overallProgress": 30,
                "steps": [
                    {"id": "prepare", "label": "מכין סביבת עבודה", "status": "completed"},
                    {"id": "clone", "label": "מוריד קוד מהמאגר", "status": "completed"},
                    {"id": "analyze", "label": "מנתח קוד סטטי", "status": "running"}
                ] + [
                    {"id": step_id, "label": label, "status": "pending"} 
                    for step_id, label in [
                        ("identify", "מזהה פגיעויות"),
                        ("report", "מייצר דו״ח")
                    ]
                ]
            })
        
        all_findings = []
        scanner_results = {}
        
        for i, scanner in enumerate(scanners):
            if progress_callback:
                current_progress = 30 + (i / len(scanners)) * 40
                progress_callback({
                    "overallProgress": current_progress,
                    "logs": [{
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "level": "info",
                        "message": f"מריץ סריקת {scanner}"
                    }]
                })
            
            result = run_scanner(scanner, target_dir)
            scanner_results[scanner] = result
            
            if result["success"]:
                findings = normalize_findings(scanner, result["data"])
                all_findings.extend(findings)
                
                if progress_callback:
                    progress_callback({
                        "logs": [{
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "level": "info",
                            "message": f"סריקת {scanner} הושלמה: נמצאו {len(findings)} ממצאים"
                        }]
                    })
            else:
                if progress_callback:
                    progress_callback({
                        "logs": [{
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "level": "warning",
                            "message": f"סריקת {scanner} נכשלה: {result.get('error', 'שגיאה לא ידועה')}"
                        }]
                    })
        
        # שלב 5: ניתוח וסיווג ממצאים
        if progress_callback:
            progress_callback({
                "overallProgress": 80,
                "status": "identifying",
                "steps": [
                    {"id": "prepare", "label": "מכין סביבת עבודה", "status": "completed"},
                    {"id": "clone", "label": "מוריד קוד מהמאגר", "status": "completed"},
                    {"id": "analyze", "label": "מנתח קוד סטטי", "status": "completed"},
                    {"id": "identify", "label": "מזהה פגיעויות", "status": "running"},
                    {"id": "report", "label": "מייצר דו״ח", "status": "pending"}
                ],
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": "מנתח וממיין ממצאים"
                }]
            })
        
        # מיון ממצאים לפי חומרה
        findings_by_severity = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": [],
            "info": []
        }
        
        for finding in all_findings:
            severity = finding.get("severity", "medium")
            if severity not in findings_by_severity:
                severity = "medium"
            findings_by_severity[severity].append(finding)
        
        # שלב 6: יצירת דוח
        if progress_callback:
            progress_callback({
                "overallProgress": 90,
                "status": "finalizing",
                "steps": [
                    {"id": "prepare", "label": "מכין סביבת עבודה", "status": "completed"},
                    {"id": "clone", "label": "מוריד קוד מהמאגר", "status": "completed"},
                    {"id": "analyze", "label": "מנתח קוד סטטי", "status": "completed"},
                    {"id": "identify", "label": "מזהה פגיעויות", "status": "completed"},
                    {"id": "report", "label": "מייצר דו״ח", "status": "running"}
                ],
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": "מייצר דו״ח סריקה מסכם"
                }]
            })
        
        # חישוב סיכום ממצאים
        findings_summary = {
            "total": len(all_findings),
            "by_severity": {severity: len(findings) for severity, findings in findings_by_severity.items()},
            "by_scanner": {scanner: len(normalize_findings(scanner, result["data"])) if result["success"] else 0 
                          for scanner, result in scanner_results.items()}
        }
        
        end_time = datetime.now(timezone.utc)
        scan_duration = (end_time - start_time).total_seconds()
        
        # עדכון סופי
        if progress_callback:
            progress_callback({
                "overallProgress": 100,
                "status": "completed",
                "steps": [
                    {"id": "prepare", "label": "מכין סביבת עבודה", "status": "completed"},
                    {"id": "clone", "label": "מוריד קוד מהמאגר", "status": "completed"},
                    {"id": "analyze", "label": "מנתח קוד סטטי", "status": "completed"},
                    {"id": "identify", "label": "מזהה פגיעויות", "status": "completed"},
                    {"id": "report", "label": "מייצר דו״ח", "status": "completed"}
                ],
                "logs": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "info",
                    "message": f"סריקה הושלמה. נמצאו {findings_summary['total']} ממצאים. משך הסריקה: {scan_duration:.1f} שניות"
                }]
            })
        
        # יצירת תוצאות סופיות
        return {
            "success": True,
            "scan_type": "SAST",
            "target": target,
            "scan_start": start_time.isoformat(),
            "scan_end": end_time.isoformat(),
            "scan_duration": scan_duration,
            "findings_summary": findings_summary,
            "findings": all_findings,
            "scanners_used": list(scanner_results.keys())
        }
        
    except Exception as e:
        logger.error(f"שגיאה בסריקת SAST: {str(e)}")
        
        if progress_callback:
            progress_callback({
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

if __name__ == "__main__":
    # דוגמה לשימוש ישיר במודול
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python sast.py <target_repo_or_dir>")
        sys.exit(1)
    
    target = sys.argv[1]
    
    def print_progress(progress):
        status = progress.get("status", "")
        logs = progress.get("logs", [])
        if logs:
            last_log = logs[-1]
            print(f"[{last_log['level'].upper()}] {last_log['message']}")
    
    result = run_sast_scan(target, progress_callback=print_progress)
    
    if result["success"]:
        print(f"\nסריקה הושלמה בהצלחה!")
        print(f"סך הכל ממצאים: {result['findings_summary']['total']}")
        for severity, count in result['findings_summary']['by_severity'].items():
            if count > 0:
                print(f"  {severity}: {count}")
    else:
        print(f"\nהסריקה נכשלה: {result['error']}") 