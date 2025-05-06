FROM python:3.10-slim

WORKDIR /app

# התקנת כלים בסיסיים
RUN apt-get update && \
    apt-get install -y git curl wget unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# התקנת Node.js (נדרש עבור Dredd)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# התקנת כלי סריקת API
RUN npm install -g dredd && \
    pip install --no-cache-dir openapi-spec-validator

# העתקת קבצי הפרויקט
COPY apps/worker/scanners/api.py /app/scanner/
COPY ./requirements-api.txt /app/

# התקנת ספריות Python הנדרשות
RUN pip install --no-cache-dir -r requirements-api.txt

# הרשאות ריצה לסקריפט
RUN chmod +x /app/scanner/api.py

# הרצת השירות
CMD ["python", "-u", "/app/scanner/api.py"] 