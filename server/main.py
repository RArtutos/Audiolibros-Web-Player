from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Dict, List, Optional
import unicodedata
from pathlib import Path
import httpx

# Initialize FastAPI app
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Load data at startup
try:
    DATA_FILE = Path("public/data/consolidated_data.json")
    with open(DATA_FILE) as f:
        audiobooks = json.load(f)
except Exception as e:
    print(f"Error loading data: {e}")
    audiobooks = {}

@app.get("/api/audiobooks")
async def get_audiobooks(
    query: Optional[str] = Query(None),
    type: str = Query("all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    try:
        # Filter books based on query and type
        filtered_books = {}
        
        if not query:
            filtered_books = audiobooks
        else:
            query = query.lower()
            for id, book in audiobooks.items():
                if type == "all":
                    if (query in book["title"].lower() or
                        any(query in (author["name"] if isinstance(author, dict) else author).lower() 
                            for author in book["authors"]) or
                        any(query in (narrator["name"] if isinstance(narrator, dict) else narrator).lower() 
                            for narrator in book["narrators"]) or
                        any(query in genre.lower() for genre in book["genres"])):
                        filtered_books[id] = book
                elif type == "title" and query in book["title"].lower():
                    filtered_books[id] = book
                elif type == "author" and any(query in (author["name"] if isinstance(author, dict) else author).lower() 
                                           for author in book["authors"]):
                    filtered_books[id] = book
                elif type == "narrator" and any(query in (narrator["name"] if isinstance(narrator, dict) else narrator).lower() 
                                             for narrator in book["narrators"]):
                    filtered_books[id] = book
                elif type == "genre" and any(query in genre.lower() for genre in book["genres"]):
                    filtered_books[id] = book

        # Pagination
        total = len(filtered_books)
        total_pages = max(1, (total + per_page - 1) // per_page)
        page = min(page, total_pages)
        
        start = (page - 1) * per_page
        end = start + per_page
        
        items = dict(list(filtered_books.items())[start:end])
        
        return {
            "data": items,
            "pagination": {
                "total": total,
                "per_page": per_page,
                "current_page": page,
                "total_pages": total_pages
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/book/{book_id}")
async def get_book(book_id: str):
    try:
        # First try direct lookup
        if book_id in audiobooks:
            return audiobooks[book_id]
        
        # Then try searching by idDownload
        book = next(
            (book for book in audiobooks.values() if book["idDownload"] == book_id),
            None
        )
        
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        return book
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/redirect/{book_id}")
async def get_redirect_url(book_id: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            url = f"https://pelis.gbstream.us.kg/api/v1/redirectdownload/tituloaudilibro.mp3?a=0&id={book_id}"
            response = await client.head(url)
            return {"url": str(response.url)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))