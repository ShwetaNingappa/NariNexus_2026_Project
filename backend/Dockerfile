# Use lightweight official Python image
FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8001

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app codebase
COPY . /app/

# Expose dynamic PORT
EXPOSE 8001

# Production run command utilizing uvicorn binding
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}
