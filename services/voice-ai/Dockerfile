FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_sm

COPY . .

RUN mkdir -p /tmp/voice-ai

ENV HOST=0.0.0.0
ENV PORT=8100
ENV LOG_LEVEL=INFO
ENV WHISPER_MODEL=base
ENV WHISPER_DEVICE=cpu
ENV TEMP_DIR=/tmp/voice-ai
ENV PYTHONUNBUFFERED=1

EXPOSE 8100

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "1"]
