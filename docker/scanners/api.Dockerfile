FROM python:3.10-slim

WORKDIR /app

# התקנת חבילות בסיסיות
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    gnupg \
    unzip \
    nodejs \
    npm

# התקנת כלים לסריקת API
RUN npm install -g \
    @stoplight/spectral-cli \
    dredd

# התקנת כלי דיווח ופייתון
RUN pip install \
    redis \
    python-dotenv \
    jsonschema \
    openapi-spec-validator \
    requests \
    pyjwt

# יצירת תיקיות עבודה
RUN mkdir -p /tmp/api /app/scanners

# התקנת וקונפיגורציה של Postman Newman
RUN npm install -g newman newman-reporter-htmlextra

# העתקת קוד הסורק
COPY apps/worker/scanners/api.py /app/scanners/
COPY apps/worker/utils/ /app/utils/

# הוספת הרשאות הרצה
RUN chmod +x /app/scanners/api.py

# פקודת הרצה
CMD ["python", "-u", "/app/scanners/api.py"] 