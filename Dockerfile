# ---------- Stage 1: build the React frontend ----------
FROM node:20-bullseye AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
# Same-origin: the built app calls "/api" on whatever host serves it (Cloud Run / your domain)
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

# ---------- Stage 2: FastAPI backend + serve the built frontend ----------
FROM python:3.11-slim AS app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend /app/frontend/build ./frontend/build

WORKDIR /app/backend
# Cloud Run provides $PORT (default 8080). Bind to it.
ENV PORT=8080
CMD exec uvicorn server:app --host 0.0.0.0 --port ${PORT}
