import os
import json
import tempfile
import shutil
import subprocess
import redis
import git
from typing import Dict, List, Any

# קישור למסד הנתונים Redis
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

def run_semgrep(repo_path: str) -> List[Dict[str, Any]]:
    """הרצת הכלי semgrep לאיתור בעיות אבטחה בקוד"""
    try:
        result = subprocess.run(
            ["semgrep", "--config", "auto", "--json", "--quiet", repo_path],
            capture_output=True,
            text=True,
            check=True
        )
        findings = json.loads(result.stdout)
        return findings.get("results", [])
    except subprocess.CalledProcessError as e:
        print(f"Error running semgrep: {e}")
        return []
    except json.JSONDecodeError:
        print("Error parsing semgrep output")
        return []

def run_trufflehog(repo_path: str) -> List[Dict[str, Any]]:
    """הרצת הכלי TruffleHog לאיתור סודות בקוד"""
    try:
        result = subprocess.run(
            ["trufflehog", "filesystem", "--json", repo_path],
            capture_output=True,
            text=True
        )
        
        findings = []
        for line in result.stdout.splitlines():
            if line.strip():
                try:
                    findings.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        
        return findings
    except subprocess.CalledProcessError as e:
        print(f"Error running trufflehog: {e}")
        return []

def run_snyk(repo_path: str) -> List[Dict[str, Any]]:
    """הרצת הכלי Snyk לאיתור פגיעויות בתלויות"""
    try:
        # בדיקה אם Snyk מותקן
        snyk_result = subprocess.run(
            ["snyk", "test", "--json"],
            cwd=repo_path,
            capture_output=True,
            text=True
        )
        
        if snyk_result.returncode > 1:  # Snyk returns 1 if vulnerabilities found
            print(f"Error running snyk: {snyk_result.stderr}")
            return []
        
        findings = json.loads(snyk_result.stdout)
        return findings.get("vulnerabilities", [])
    except subprocess.CalledProcessError as e:
        print(f"Error running snyk: {e}")
        return []
    except json.JSONDecodeError:
        print("Error parsing snyk output")
        return []
    except FileNotFoundError:
        print("Snyk not installed, skipping dependency check")
        return []

def clone_repo(repo_url: str, branch: str) -> str:
    """שיבוט מאגר הקוד למערכת הקבצים המקומית"""
    temp_dir = tempfile.mkdtemp()
    try:
        git.Repo.clone_from(
            repo_url, 
            temp_dir,
            branch=branch,
            depth=1
        )
        return temp_dir
    except Exception as e:
        shutil.rmtree(temp_dir)
        raise Exception(f"Failed to clone repository: {str(e)}")

def map_severity(severity: str) -> str:
    """המרת רמות חומרה מפורמטים שונים לפורמט אחיד"""
    severity = severity.lower()
    if severity in ["critical", "השמש"]:
        return "CRITICAL"
    elif severity in ["high", "גבוה"]:
        return "HIGH"
    elif severity in ["medium", "בינוני"]:
        return "MEDIUM"
    elif severity in ["low", "נמוך"]:
        return "LOW"
    else:
        return "INFO"

def publish_finding(project_id: str, finding: Dict[str, Any], tool: str):
    """פרסום ממצא לערוץ ה-Redis"""
    redis_client.publish(
        f"scan:{project_id}",
        json.dumps({
            "type": "finding",
            "tool": tool,
            "projectId": project_id,
            "finding": finding
        })
    )

def run_sast(project_id: str, repo_url: str, branch: str):
    """הרצת סריקת אבטחה סטטית מלאה"""
    try:
        # עדכון סטטוס התחלת הסריקה
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "progress",
                "status": "cloning",
                "projectId": project_id,
                "message": "משכפל את מאגר הקוד..."
            })
        )
        
        # שיבוט המאגר
        repo_path = clone_repo(repo_url, branch)
        
        try:
            # הרצת סריקה עם semgrep
            redis_client.publish(
                f"scan:{project_id}",
                json.dumps({
                    "type": "progress",
                    "status": "scanning",
                    "projectId": project_id,
                    "message": "סורק את הקוד עם Semgrep..."
                })
            )
            
            semgrep_findings = run_semgrep(repo_path)
            
            for finding in semgrep_findings:
                mapped_finding = {
                    "severity": map_severity(finding.get("extra", {}).get("severity", "info")),
                    "ruleId": finding.get("check_id", "unknown"),
                    "title": finding.get("extra", {}).get("message", "Unknown issue"),
                    "description": finding.get("extra", {}).get("metadata", {}).get("description", "No description"),
                    "filePath": finding.get("path", ""),
                    "lineStart": finding.get("start", {}).get("line", 0),
                    "lineEnd": finding.get("end", {}).get("line", 0),
                }
                publish_finding(project_id, mapped_finding, "semgrep")
            
            # הרצת סריקה עם trufflehog
            redis_client.publish(
                f"scan:{project_id}",
                json.dumps({
                    "type": "progress",
                    "status": "scanning",
                    "projectId": project_id,
                    "message": "מחפש סודות עם TruffleHog..."
                })
            )
            
            trufflehog_findings = run_trufflehog(repo_path)
            
            for finding in trufflehog_findings:
                mapped_finding = {
                    "severity": "HIGH",  # סודות הם תמיד חמורים
                    "ruleId": finding.get("detector_type", "unknown"),
                    "title": f"Secret found: {finding.get('detector_type', 'Unknown')}",
                    "description": "A potential secret was found in the code. Secrets should never be stored in source code.",
                    "filePath": finding.get("file", ""),
                    "lineStart": finding.get("line", 0),
                    "lineEnd": finding.get("line", 0),
                }
                publish_finding(project_id, mapped_finding, "trufflehog")
            
            # הרצת סריקת תלויות עם snyk
            redis_client.publish(
                f"scan:{project_id}",
                json.dumps({
                    "type": "progress",
                    "status": "scanning",
                    "projectId": project_id,
                    "message": "בודק תלויות פגיעות עם Snyk..."
                })
            )
            
            snyk_findings = run_snyk(repo_path)
            
            for finding in snyk_findings:
                mapped_finding = {
                    "severity": map_severity(finding.get("severity", "info")),
                    "ruleId": finding.get("id", "unknown"),
                    "title": f"Vulnerable dependency: {finding.get('packageName', 'Unknown')}",
                    "description": finding.get("description", "No description"),
                    "filePath": finding.get("from", [""])[0] if finding.get("from") else "",
                }
                publish_finding(project_id, mapped_finding, "snyk")
            
            # עדכון סטטוס סיום הסריקה
            redis_client.publish(
                f"scan:{project_id}",
                json.dumps({
                    "type": "progress",
                    "status": "completed",
                    "projectId": project_id,
                    "message": "סריקת SAST הושלמה",
                    "findings_count": len(semgrep_findings) + len(trufflehog_findings) + len(snyk_findings)
                })
            )
            
        finally:
            # ניקוי - מחיקת התיקייה הזמנית
            shutil.rmtree(repo_path)
            
    except Exception as e:
        # דיווח על שגיאה
        redis_client.publish(
            f"scan:{project_id}",
            json.dumps({
                "type": "error",
                "status": "error",
                "projectId": project_id,
                "message": f"שגיאה בסריקת SAST: {str(e)}"
            })
        ) 