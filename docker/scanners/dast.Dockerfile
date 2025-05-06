FROM python:3.10-slim

WORKDIR /app

# התקנת חבילות בסיסיות
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    gnupg \
    lsb-release \
    unzip \
    libxslt1-dev \
    chromium \
    firefox-esr

# התקנת Java (נדרש עבור ZAP)
RUN apt-get update && apt-get install -y \
    openjdk-17-jre

# התקנת OWASP ZAP
RUN mkdir -p /opt/zap && \
    curl -L https://github.com/zaproxy/zaproxy/releases/download/v2.13.0/ZAP_2.13.0_Linux.tar.gz | \
    tar zx -C /opt/zap --strip-components=1

# התקנת כלי דיווח
RUN pip install \
    redis \
    python-dotenv \
    jsonschema \
    selenium \
    python-owasp-zap-v2.4

# יצירת תיקיות עבודה
RUN mkdir -p /tmp/dast /app/scanners

# העתקת קוד הסורק
COPY apps/worker/scanners/dast.py /app/scanners/
COPY apps/worker/utils/ /app/utils/

# הוספת ZAP ל-PATH
ENV PATH=$PATH:/opt/zap

# הוספת הרשאות הרצה
RUN chmod +x /app/scanners/dast.py

# פקודת הרצה
CMD ["python", "-u", "/app/scanners/dast.py"] 