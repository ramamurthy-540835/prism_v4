# One root image intentionally contains both Node and Python. Cloud Run selects
# a command per service/job, preventing the UI-only deployment failure mode.
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY knowledge/requirements.txt ./knowledge/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r knowledge/requirements.txt
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=8080 PYTHONPATH=/app
EXPOSE 8080
CMD ["sh", "-c", "npm run start -- -p ${PORT:-8080}"]
