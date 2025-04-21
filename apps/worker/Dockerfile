FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for security tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run as non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# Set env vars
ENV PYTHONUNBUFFERED=1

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 