import subprocess, tempfile, os, shutil

def clone_repo(repo_url: str, branch: str) -> str:
    workdir = tempfile.mkdtemp(prefix="arxio-")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", "--branch", branch, repo_url, workdir],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return workdir
    except subprocess.CalledProcessError as e:
        shutil.rmtree(workdir, ignore_errors=True)
        raise RuntimeError(f"Git clone failed: {e.stderr.decode()}") 