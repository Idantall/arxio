import json, subprocess, tempfile, pathlib, os, uuid
from .parsers import zap_to_findings

def run_dast(target_url: str):
    outdir = tempfile.mkdtemp(prefix="dast-")
    report = pathlib.Path(outdir, "zap.json")
    subprocess.run([
        "docker", "run", "--network=host", "-v", f"{outdir}:/zap/wrk:z",
        "owasp/zap2docker-stable", "zap-baseline.py",
        "-t", target_url, "-J", "/zap/wrk/zap.json", "-m", "5"
    ], check=False)
    yield from zap_to_findings(report) 