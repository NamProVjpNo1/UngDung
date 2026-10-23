import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.api.routes import router

app = FastAPI(title="VB2 CA4 Study", version="0.1.0", description="Ứng dụng học tập cục bộ, một người dùng. Không phải cấu trúc kỳ thi chính thức.")
app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"], allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"], allow_headers=["Content-Type"])


@app.middleware("http")
async def local_access(request: Request, call_next):
    # Reject DNS rebinding and cross-site browser mutations against localhost.
    host = request.headers.get("host", "").split(":")[0]
    if host not in ("127.0.0.1", "localhost", "testserver"):
        return JSONResponse({"detail": "Chỉ cho phép truy cập localhost."}, status_code=403)
    origin = request.headers.get("origin")
    if origin and origin not in ("http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8000", "http://localhost:8000"):
        return JSONResponse({"detail": "Nguồn truy cập không được phép."}, status_code=403)
    if request.headers.get("sec-fetch-site") == "cross-site":
        return JSONResponse({"detail": "Không cho phép yêu cầu từ trang bên ngoài."}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(router)
frontend = Path(os.environ.get("APP_FRONTEND_DIR", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
# Repository frontend is a sibling of backend.
if not frontend.is_dir():
    frontend = Path(__file__).resolve().parents[2].parent / "frontend" / "dist"
if frontend.is_dir():
    app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
