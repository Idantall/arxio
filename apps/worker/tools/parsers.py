import json, pathlib
from models import Finding, Severity

def semgrep_to_findings(path: pathlib.Path):
    if not path.exists(): 
        return
    data = json.loads(path.read_text())
    for res in data.get("results", []):
        sev = Severity[res["extra"]["severity"].upper()]
        yield Finding(
            rule_id=res["check_id"],
            title=res["extra"]["message"][:120],
            description=res["extra"].get("metadata", {}).get("description", ""),
            severity=sev,
            file_path=res["path"],
            line_start=res["start"]["line"],
            line_end=res["end"]["line"]
        )

def trufflehog_to_findings(path: pathlib.Path):
    if not path.exists() or path.stat().st_size == 0:
        return
    
    lines = path.read_text().splitlines()
    for line in lines:
        if not line.strip():
            continue
        
        try:
            result = json.loads(line)
            yield Finding(
                rule_id=f"trufflehog:{result.get('DetectorType', 'secret')}",
                title=f"Secret found: {result.get('DetectorType', 'Unknown')}",
                description=f"Found potentially hardcoded secret of type {result.get('DetectorType')}\n"
                            f"Secret: {result.get('Raw', '')[:20]}...",
                severity=Severity.HIGH,
                file_path=result.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {}).get("file", ""),
                line_start=result.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {}).get("line", 0),
                line_end=result.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {}).get("line", 0),
            )
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing TruffleHog result: {e}")
            continue

def osv_to_findings(path: pathlib.Path):
    if not path.exists() or path.stat().st_size == 0:
        return
    
    try:
        data = json.loads(path.read_text())
        for result in data.get("results", []):
            for pkg in result.get("packages", []):
                for vuln in pkg.get("vulnerabilities", []):
                    severity_mapping = {
                        "CRITICAL": Severity.CRITICAL,
                        "HIGH": Severity.HIGH,
                        "MEDIUM": Severity.MEDIUM,
                        "LOW": Severity.LOW,
                        "": Severity.INFO
                    }
                    
                    sev_str = vuln.get("severity", "").upper()
                    sev = severity_mapping.get(sev_str, Severity.INFO)
                    
                    yield Finding(
                        rule_id=f"osv:{vuln.get('id', 'unknown')}",
                        title=f"Vulnerable dependency: {pkg.get('name')} {pkg.get('version')}",
                        description=vuln.get("summary", ""),
                        severity=sev,
                        file_path="package.json",
                        url=vuln.get("references", [{}])[0].get("url", "")
                    )
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error parsing OSV scanner result: {e}")
        return

def zap_to_findings(path: pathlib.Path):
    if not path.exists() or path.stat().st_size == 0:
        return
    
    try:
        data = json.loads(path.read_text())
        for site in data.get("site", []):
            for alert in site.get("alerts", []):
                # Map ZAP risk to our severity
                risk_to_severity = {
                    "High": Severity.HIGH,
                    "Medium": Severity.MEDIUM,
                    "Low": Severity.LOW,
                    "Informational": Severity.INFO
                }
                sev = risk_to_severity.get(alert.get("risk", ""), Severity.INFO)
                
                # Get instances of this alert
                for instance in alert.get("instances", []):
                    yield Finding(
                        rule_id=f"zap:{alert.get('pluginId', '')}",
                        title=alert.get("name", "")[:120],
                        description=f"{alert.get('description', '')}\n\nSolution: {alert.get('solution', '')}",
                        severity=sev,
                        url=instance.get("uri", "")
                    )
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error parsing ZAP result: {e}")
        return 