FROM python:3.10-slim

WORKDIR /app

# התקנת חבילות בסיסיות
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# יצירת מבנה התיקיות
RUN mkdir -p /app/worker /app/utils

# העתקת קבצי הפרויקט
COPY apps/worker/requirements.txt /app/
COPY apps/worker/worker.py /app/worker/
COPY apps/worker/utils/* /app/utils/

# התקנת חבילות Python
RUN pip install --no-cache-dir -r requirements.txt

# הגדרת הרשאות הרצה
RUN chmod +x /app/worker/worker.py

# פתיחת פורט (אם צריך)
# EXPOSE 8000

# הרצת השירות
CMD ["python", "/app/worker/worker.py"] 