import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers import progress_controller, user_controller, lesson_controller, leaderboard_controller, auth_controller, quizz_controller, flashcard_controller, chat_controller, roadmap_controller, chapters_controller, files_controller  # Updated controllers
from controllers import health_controller  # Health check endpoints
from db import engine, Base
from controllers import youtube_controller  # <- thêm import này

# Configure logging - must be done before uvicorn starts
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(name)s - %(message)s',
    force=True  # Override any existing configuration
)

# Set log level for our application modules
logging.getLogger("services.chat_service").setLevel(logging.INFO)
logging.getLogger("services.chat_tools").setLevel(logging.INFO)
logging.getLogger("services.gemini_file_search").setLevel(logging.INFO)
logging.getLogger("services").setLevel(logging.INFO)
logging.getLogger("controllers").setLevel(logging.INFO)

# Suppress noisy warnings from langchain
logging.getLogger("langchain_groq").setLevel(logging.ERROR)

# Get logger for this module to verify it's working
logger = logging.getLogger(__name__)
logger.info("Logging configured - INFO level enabled for services")

def create_app() -> FastAPI:
    app = FastAPI(title="Learning API", version="0.1.0")

    # Configure CORS
    cors_origins_str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,https://aitutor.io.vn,https://api.aitutor.io.vn"
    )
    # Add FRONTEND_URL if provided
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        cors_origins_str += f",{frontend_url}"
    
    cors_origins = cors_origins_str.split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS configured for origins: {cors_origins}")

    # Optional: Add rate limiting middleware
    enable_rate_limit = os.getenv("ENABLE_RATE_LIMIT", "false").lower() == "true"
    if enable_rate_limit:
        from middleware.rate_limit import RateLimiter, RateLimitMiddleware
        rate_limiter = RateLimiter(
            requests_per_minute=int(os.getenv("RATE_LIMIT_RPM", "60")),
            requests_per_hour=int(os.getenv("RATE_LIMIT_RPH", "1000"))
        )
        app.add_middleware(RateLimitMiddleware, rate_limiter=rate_limiter)
        logger.info("🔒 Rate limiting middleware enabled")

    # Include routers
    app.include_router(health_controller.router)  # Health check first
    app.include_router(auth_controller.router) 
    app.include_router(progress_controller.router)
    app.include_router(files_controller.router) 
    app.include_router(user_controller.router)
    app.include_router(lesson_controller.router)
    app.include_router(leaderboard_controller.router)
    app.include_router(quizz_controller.router) 
    app.include_router(flashcard_controller.router)
    app.include_router(chat_controller.router)
    app.include_router(chapters_controller.router)
    app.include_router(roadmap_controller.router)
    # trong create_app()
    app.include_router(youtube_controller.router)

    @app.on_event("startup")
    def on_startup():
        Base.metadata.create_all(bind=engine)

    # 👇 thêm route test này
    @app.get("/")
    def root():
        return {"message": "Backend is running successfully 🚀"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
