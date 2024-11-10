from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Dict, List, Optional
import unicodedata
from pathlib import Path
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Load data and create search index at startup
DATA_FILE = Path("public/data/consolidated_data.json")
with open(DATA_FILE) as f:
    audiobooks = json.load(f)

@app.get("/api/redirect/{book_id}")
async def get_redirect_url(book_id: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            url = f"https://pelis.gbstream.us.kg/api/v1/redirectdownload/tituloaudilibro.mp3?a=0&id={book_id}"
            response = await client.head(url)
            return {"url": str(response.url)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audiobooks")
async def get_audiobooks(
    query: Optional[str] = Query(None),
    type: str = Query("all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    # Search books implementation...
    # (rest of the existing code remains the same)
    pass

@app.get("/api/book/{book_id}")
async def get_book(book_id: str):
    # Get book implementation...
    # (rest of the existing code remains the same)
    pass