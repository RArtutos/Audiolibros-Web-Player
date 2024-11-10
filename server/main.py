from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Dict, List, Optional
import unicodedata
from pathlib import Path
import httpx

# Initialize FastAPI app
app = FastAPI()

# CORS configuration with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

def normalize_text(text: str) -> str:
    """Normalize text for searching"""
    text = text.lower()
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    return ''.join(c for c in text if c.isalnum() or c.isspace())

def search_books(query: str, search_type: str, search_index: Dict[str, set], audiobooks: Dict) -> List[str]:
    """Search books using the index"""
    if not query:
        return list(audiobooks.keys())
    
    query_terms = normalize_text(query).split()
    results = None
    
    for term in query_terms:
        matching_ids = search_index.get(term, set())
        if results is None:
            results = matching_ids
        else:
            results &= matching_ids
    
    if not results:
        return []
    
    # Filter by type if specified
    if search_type != "all":
        filtered_results = set()
        for book_id in results:
            book = audiobooks[book_id]
            if search_type == "title" and any(term in normalize_text(book["title"]) for term in query_terms):
                filtered_results.add(book_id)
            elif search_type == "author" and any(
                any(term in normalize_text(author["name"] if isinstance(author, dict) else author) 
                    for term in query_terms)
                for author in book["authors"]
            ):
                filtered_results.add(book_id)
            elif search_type == "narrator" and any(
                any(term in normalize_text(narrator["name"] if isinstance(narrator, dict) else narrator)
                    for term in query_terms)
                for narrator in book["narrators"]
            ):
                filtered_results.add(book_id)
            elif search_type == "genre" and any(
                any(term in normalize_text(genre) for term in query_terms)
                for genre in book["genres"]
            ):
                filtered_results.add(book_id)
        results = filtered_results
    
    return list(results)

# Load data and create search index at startup
try:
    DATA_FILE = Path("public/data/consolidated_data.json")
    with open(DATA_FILE) as f:
        audiobooks = json.load(f)

    # Create search index
    search_index = {}
    for id, book in audiobooks.items():
        # Index title
        terms = normalize_text(book["title"]).split()
        for term in terms:
            if term not in search_index:
                search_index[term] = set()
            search_index[term].add(id)
        
        # Index authors
        for author in book["authors"]:
            author_name = author["name"] if isinstance(author, dict) else author
            terms = normalize_text(author_name).split()
            for term in terms:
                if term not in search_index:
                    search_index[term] = set()
                search_index[term].add(id)
        
        # Index narrators
        for narrator in book["narrators"]:
            narrator_name = narrator["name"] if isinstance(narrator, dict) else narrator
            terms = normalize_text(narrator_name).split()
            for term in terms:
                if term not in search_index:
                    search_index[term] = set()
                search_index[term].add(id)
        
        # Index genres
        for genre in book["genres"]:
            terms = normalize_text(genre).split()
            for term in terms:
                if term not in search_index:
                    search_index[term] = set()
                search_index[term].add(id)
except Exception as e:
    print(f"Error loading data: {e}")
    audiobooks = {}
    search_index = {}

@app.get("/api/audiobooks")
async def get_audiobooks(
    query: Optional[str] = Query(None),
    type: str = Query("all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    try:
        # Search books
        results = search_books(query, type, search_index, audiobooks)
        
        # Calculate pagination
        total = len(results)
        total_pages = max(1, (total + per_page - 1) // per_page)
        page = min(page, total_pages)
        start = (page - 1) * per_page
        end = start + per_page
        
        # Get page of results
        page_results = {
            id: audiobooks[id]
            for id in results[start:end]
        }
        
        return {
            "data": page_results,
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
        # Search for the book by idDownload
        book = next(
            (book for book in audiobooks.values() if book["idDownload"] == book_id),
            None
        )
        
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        return book
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
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
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
