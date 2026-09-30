from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from services.video import final  # import hàm final bạn đã viết

router = APIRouter(prefix="/api", tags=["youtube"])

class YoutubeRequest(BaseModel):
    url: str

@router.post("/parse-youtube")
async def parse_youtube(req: YoutubeRequest):
    try:
        # Video extraction and the external summarizer are blocking operations.
        # Run them off the event loop so other API routes remain responsive.
        content = await run_in_threadpool(final, req.url)
        return JSONResponse(content={"content": content})
    except Exception as e:
        message = str(e)
        if "HTTP Error 429" in message:
            return JSONResponse(
                content={"error": "YouTube is temporarily rate-limiting subtitle downloads. Please wait before trying this video again."},
                status_code=429,
            )
        return JSONResponse(content={"error": message}, status_code=500)
