"""Childeric backend.

The Childeric app is offline-first: all user data stays on the device.
This backend only exposes a health check so the platform can verify the
service is alive. No personal data is ever received or stored here.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Childeric API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "childeric"}
