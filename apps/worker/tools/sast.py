import json, subprocess, pathlib, tempfile
from .parsers import semgrep_to_findings, trufflehog_to_findings, osv_to_findings

def run_sast(repo_path: str):
    outdir = tempfile.mkdtemp(prefix="sast-")
    semgrep_json = pathlib.Path(outdir, "semgrep.json")
    subprocess.run(
        ["semgrep", "--config", "p/owasp-top-ten", "--json", "-o", str(semgrep_json), repo_path],
        check=False)      # we tolerate rule errors
    yield from semgrep_to_findings(semgrep_json)

    th_json = pathlib.Path(outdir, "secrets.json")
    subprocess.run(
        ["trufflehog", "filesystem", "--json", repo_path], 
        stdout=open(th_json, "w")
    )
    yield from trufflehog_to_findings(th_json)

    osv_json = pathlib.Path(outdir, "deps.json")
    subprocess.run(
        ["osv-scanner", "--lockfile", pathlib.Path(repo_path, "package-lock.json")],
        stdout=open(osv_json, "w"), 
        check=False
    )
    yield from osv_to_findings(osv_json) 