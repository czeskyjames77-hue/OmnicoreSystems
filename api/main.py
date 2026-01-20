import os
from fastapi import FastAPI, Query as FastAPIQuery
from fastapi.middleware.cors import CORSMiddleware
from serpapi import GoogleSearch
from pydantic import BaseModel
from typing import List
import uvicorn

# Neu für Supabase/PostgreSQL
from sqlalchemy import create_engine, Column, String, Integer, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- DATABASE SETUP (Supabase) ---
# DATABASE_URL muss in Vercel als Environment Variable hinterlegt werden
DATABASE_URL = os.environ.get("DATABASE_URL")
# Falls DATABASE_URL mit postgres:// beginnt, muss es für SQLAlchemy oft in postgresql:// geändert werden
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Tabellen-Definitionen
class CompanyDB(Base):
    __tablename__ = "companies"
    data_id = Column(String, primary_key=True)
    title = Column(String)
    address = Column(String)
    rating = Column(Float)

class ReviewDB(Base):
    __tablename__ = "reviews"
    id = Column(String, primary_key=True)
    data_id = Column(String)
    author = Column(String)
    rating = Column(Integer)
    text = Column(String)

# Erstellt die Tabellen in Supabase, falls sie noch nicht existieren
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key sicher aus Environment laden
API_KEY = os.environ.get("SERPAPI_KEY", "715d6e97d27a5646cc09f12dd817202e558db7572beb4fdde55ceb3ee25a427f")

class CheckoutRequest(BaseModel):
    reviews: List[dict]
    company: dict
    customerDetails: dict

def analyze_review(rating: int, text: str):
    """
    Die Omnicore AI-Logik zur Bewertung von Löschchancen.
    """
    text_lower = text.lower().strip()
    
    # 1. Kategorie: Der "Ghost"-Eintrag
    if rating <= 3 and len(text_lower) == 0:
        return {"violation": "Verstoß gegen Erfahrungsbericht-Pflicht (Fake-Verdacht)", "confidence": 98}

    # 2. Kategorie: Die Beleidigung
    insults = ["unverschämt", "frech", "arrogant", "unfähig", "dumm", "idiot", "sauladen", "unfreundlich", "unprofessionell"]
    if any(word in text_lower for word in insults):
        return {"violation": "Unzulässige Schmähkritik & Verletzung der Persönlichkeitsrechte", "confidence": 95}

    # 3. Kategorie: Der Verleumder
    claims = ["betrug", "abzocke", "lüge", "gestohlen", "betrüger", "abgezockt", "abzocker", "abzocken"]
    if any(word in text_lower for word in claims):
        return {"violation": "Unbewiesene Tatsachenbehauptung (Beweislast beim Verfasser)", "confidence": 88}

    # 4. Kategorie: Grauzone
    if rating <= 3:
        if len(text_lower) < 50:
            return {"violation": "Inhaltlicher Widerspruch zur Google-Relevanz-Richtlinie", "confidence": 75}
        else:
            return {"violation": "Prüfungsrelevanter Diffamierungsverdacht", "confidence": 65}

    return {"violation": None, "confidence": 100}

@app.get("/api/search")
async def search(name: str = FastAPIQuery(...), address: str = FastAPIQuery("")):
    query = f"{name} {address}".strip()
    search = GoogleSearch({"engine": "google_maps", "q": query, "api_key": API_KEY})
    res = search.get_dict()
    
    place = res.get("place_results")
    if not place and res.get("local_results"):
        place = res.get("local_results")[0]
        
    if place:
        return {
            "title": place.get("title"),
            "name": place.get("title"),
            "address": place.get("address"),
            "data_id": place.get("data_id") or place.get("lsig"),
            "rating": place.get("rating", 0)
        }
    return {"error": "Unternehmen nicht gefunden"}

@app.get("/api/reviews")
async def get_reviews(data_id: str, name: str = ""):
    all_formatted_reviews = []
    next_page_token = None
    
    for page in range(0, 3):
        params = {
            "engine": "google_maps_reviews",
            "data_id": data_id,
            "api_key": API_KEY,
        }
        if next_page_token:
            params["next_page_token"] = next_page_token

        search = GoogleSearch(params)
        results = search.get_dict()
        raw_reviews = results.get("reviews", [])
        
        for r in raw_reviews:
            user_data = r.get("user", {})
            author_name = user_data.get("name") or r.get("author") or "Unbekannter Nutzer"
            rating = r.get("rating", 0)
            snippet = r.get("snippet") or r.get("text") or ""
            analysis = analyze_review(rating, snippet)
            
            review_obj = {
                "id": r.get("link", str(hash(author_name + snippet))),
                "author": author_name,
                "rating": rating,
                "text": snippet if snippet else "Kein Kommentar hinterlassen",
                "date": r.get("date", "Vor kurzem"),
                "confidence": analysis["confidence"],
                "violation": analysis["violation"],
                "secure": rating > 3
            }
            all_formatted_reviews.append(review_obj)
        
        next_page_token = results.get("serpapi_pagination", {}).get("next_page_token")
        if not next_page_token:
            break

    sorted_reviews = sorted(all_formatted_reviews, key=lambda x: x['rating'])

    # DB Update (Supabase)
    db = SessionLocal()
    try:
        for rev in sorted_reviews:
            db_review = ReviewDB(
                id=rev["id"],
                data_id=data_id,
                author=rev["author"],
                rating=rev["rating"],
                text=rev["text"]
            )
            db.merge(db_review) # merge funktioniert wie "INSERT OR REPLACE"
        db.commit()
    except Exception as e:
        print(f"DB Error: {e}")
        db.rollback()
    finally:
        db.close()

    return sorted_reviews

@app.post("/api/create-checkout-session")
async def checkout(req: CheckoutRequest):
    print(f"Checkout-Auftrag von: {req.customerDetails.get('email')}")
    return {"url": "https://buy.stripe.com/demo_checkout_link"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)