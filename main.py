import sqlite3
from fastapi import FastAPI, Query as FastAPIQuery
from fastapi.middleware.cors import CORSMiddleware
from serpapi import GoogleSearch
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = "715d6e97d27a5646cc09f12dd817202e558db7572beb4fdde55ceb3ee25a427f"

def init_db():
    conn = sqlite3.connect("omnicore.db")
    c = conn.cursor()
    c.execute('CREATE TABLE IF NOT EXISTS companies (data_id TEXT PRIMARY KEY, title TEXT, address TEXT, rating REAL)')
    c.execute('CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, data_id TEXT, author TEXT, rating INTEGER, text TEXT)')
    conn.commit()
    conn.close()

init_db()

class CheckoutRequest(BaseModel):
    reviews: List[dict]
    company: dict
    customerDetails: dict

def analyze_review(rating: int, text: str):
    """
    Die Omnicore AI-Logik zur Bewertung von Löschchancen.
    Analysiert Texte auf juristische Angriffspunkte nach Google-Richtlinien.
    """
    text_lower = text.lower().strip()
    
    # 1. Kategorie: Der "Ghost"-Eintrag (1-3 Sterne ohne Text)
    if rating <= 3 and len(text_lower) == 0:
        return {
            "violation": "Verstoß gegen Erfahrungsbericht-Pflicht (Fake-Verdacht)",
            "confidence": 98
        }

    # 2. Kategorie: Die Beleidigung / Schmähkritik
    insults = ["unverschämt", "frech", "arrogant", "unfähig", "dumm", "idiot", "sauladen", "unfreundlich", "unprofessionell"]
    if any(word in text_lower for word in insults):
        return {
            "violation": "Unzulässige Schmähkritik & Verletzung der Persönlichkeitsrechte",
            "confidence": 95
        }

    # 3. Kategorie: Der Verleumder (Unbewiesene Tatsachenbehauptungen)
    claims = ["betrug", "abzocke", "lüge", "gestohlen", "betrüger", "abgezockt", "abzocker", "abzocken"]
    if any(word in text_lower for word in claims):
        return {
            "violation": "Unbewiesene Tatsachenbehauptung (Beweislast beim Verfasser)",
            "confidence": 88
        }

    # 4. Kategorie: Grauzone / Geringe Relevanz
    if rating <= 3:
        if len(text_lower) < 50:
            return {
                "violation": "Inhaltlicher Widerspruch zur Google-Relevanz-Richtlinie",
                "confidence": 75
            }
        else:
            return {
                "violation": "Prüfungsrelevanter Diffamierungsverdacht",
                "confidence": 65
            }

    # Sicherer Bereich (4-5 Sterne)
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
    
    # Omnicore Deep Scan: Wir laden bis zu 3 Seiten (ca. 30 Rezensionen)
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
            # Klarnamen-Extraktion
            user_data = r.get("user", {})
            author_name = user_data.get("name") or r.get("author") or "Unbekannter Nutzer"
            
            rating = r.get("rating", 0)
            snippet = r.get("snippet") or r.get("text") or ""
            
            # Dynamische AI-Analyse aufrufen
            analysis = analyze_review(rating, snippet)
            
            review_obj = {
                "id": r.get("link", str(hash(author_name + snippet))),
                "author": author_name,
                "rating": rating,
                "text": snippet if snippet else "Kein Kommentar hinterlassen",
                "date": r.get("date", "Vor kurzem"),
                "confidence": analysis["confidence"],
                "violation": analysis["violation"],
                "secure": rating > 3 # 4 & 5 Sterne sind sicher, 1-3 bekommen den Lösch-Button
            }
            all_formatted_reviews.append(review_obj)
        
        next_page_token = results.get("serpapi_pagination", {}).get("next_page_token")
        if not next_page_token:
            break

    # SORTIERUNG: Die schlechtesten Bewertungen zuerst
    sorted_reviews = sorted(all_formatted_reviews, key=lambda x: x['rating'])

    # Datenbank-Update
    conn = sqlite3.connect("omnicore.db")
    c = conn.cursor()
    for rev in sorted_reviews:
        c.execute("INSERT OR REPLACE INTO reviews VALUES (?,?,?,?,?)", 
                  (rev["id"], data_id, rev["author"], rev["rating"], rev["text"]))
    conn.commit()
    conn.close()

    return sorted_reviews

@app.post("/api/create-checkout-session")
async def checkout(req: CheckoutRequest):
    print(f"Checkout-Auftrag von: {req.customerDetails.get('email')}")
    print(f"Firma: {req.company.get('name')}")
    print(f"Anzahl Löschungen: {len(req.reviews)}")
    # Später Stripe-Integration hier
    return {"url": "https://buy.stripe.com/demo_checkout_link"}

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000)) # Liest den Port vom Cloud-Anbieter
    uvicorn.run(app, host="0.0.0.0", port=port)