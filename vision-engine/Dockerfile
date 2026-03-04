FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for computer vision libraries
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the Flask/SocketIO port
EXPOSE 8000

CMD ["python", "src/app.py"]
