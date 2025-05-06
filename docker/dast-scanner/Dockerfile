FROM python:3.10-slim

WORKDIR /app

# התקנת כלים בסיסיים
RUN apt-get update && \
    apt-get install -y git curl wget unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# התקנת OWASP ZAP
RUN wget -q https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Linux.tar.gz && \
    tar -xzf ZAP_2.14.0_Linux.tar.gz && \
    rm ZAP_2.14.0_Linux.tar.gz && \
    mv ZAP_2.14.0 /opt/zap

# התקנת Nikto
RUN git clone https://github.com/sullo/nikto.git /opt/nikto

# העתקת קבצי הפרויקט
COPY apps/worker/scanners/dast.py /app/scanner/
COPY ./requirements-dast.txt /app/

# התקנת ספריות Python הנדרשות
RUN pip install --no-cache-dir -r requirements-dast.txt

# הרשאות ריצה לסקריפט
RUN chmod +x /app/scanner/dast.py

# הגדרת משתני סביבה
ENV PATH="/opt/zap:${PATH}"
ENV NIKTO_PATH="/opt/nikto/program"

# הרצת השירות
CMD ["python", "-u", "/app/scanner/dast.py"] 