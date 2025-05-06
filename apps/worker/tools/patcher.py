import openai, difflib, pathlib, subprocess, tempfile, uuid, os
from models import Finding

def suggest_patch(f: Finding, repo_path: str) -> str:
    file = pathlib.Path(repo_path, f.file_path)
    if not file.exists():
        return "File not found"
    
    snippet = "\n".join(file.read_text().splitlines()[f.line_start-1:f.line_end])
    
    prompt = f"""You are ARXIO security bot.
Vulnerability: {f.title}
Severity: {f.severity}
Code snippet:
```{file.name}:{f.line_start}-{f.line_end}
{snippet}
```

Produce a minimal unified diff that fixes the issue."""
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini", 
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )
    
    return response.choices[0].message.content.strip() 