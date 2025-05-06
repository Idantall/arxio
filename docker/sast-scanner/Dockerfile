FROM python:3.10-slim

WORKDIR /app

# התקנת כלים בסיסיים
RUN apt-get update && \
    apt-get install -y git curl wget unzip default-jre nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# התקנת כלי סריקת קוד
RUN pip install --no-cache-dir bandit semgrep safety && \
    npm install -g snyk retire

# העתקת קבצי הפרויקט
COPY apps/worker/scanners/sast.py /app/scanner/
COPY ./requirements-sast.txt /app/

# התקנת ספריות Python הנדרשות
RUN pip install --no-cache-dir -r requirements-sast.txt

# הרשאות ריצה לסקריפט
RUN chmod +x /app/scanner/sast.py

# הרצת השירות
CMD ["python", "-u", "/app/scanner/sast.py"] 