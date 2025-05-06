FROM python:3.10-slim

WORKDIR /app

# התקנת חבילות בסיסיות
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    nodejs \
    npm

# התקנת כלי סריקה מקומיים
RUN pip install \
    bandit \
    semgrep \
    safety \
    pylint

# התקנת nodejsscan לסריקת קוד JavaScript
RUN npm install -g nodejsscan

# התקנת כלי דיווח
RUN pip install \
    redis \
    python-dotenv \
    jsonschema

# יצירת תיקיות עבודה
RUN mkdir -p /tmp/sast /app/scanners

# העתקת קוד הסורק
COPY apps/worker/scanners/sast.py /app/scanners/
COPY apps/worker/utils/ /app/utils/

# הוספת הרשאות הרצה
RUN chmod +x /app/scanners/sast.py

# פקודת הרצה
CMD ["python", "-u", "/app/scanners/sast.py"] 