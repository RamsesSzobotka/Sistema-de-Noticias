FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/req.txt .
RUN pip install --no-cache-dir -r req.txt

COPY backend/ /app/
COPY frontend/ /frontend/

WORKDIR /app/app

EXPOSE 8000

ENTRYPOINT ["bash", "/app/entrypoint.sh"]
