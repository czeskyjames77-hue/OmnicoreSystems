import requests

def get_google_reviews(data_id, max_limit=100):
    """
    Ruft Google Rezensionen via Scrapingdog API ab.
    Benötigt die data_id (ludocid) aus der Suche.
    """
    # DEIN SCRAPINGDOG API KEY
    API_KEY = "696f316c8fb21345e900e7f8" 
    URL = "https://api.scrapingdog.com/google/reviews"
    
    params = {
        "api_key": API_KEY,
        "data_id": data_id,
        "country": "de",
        "hl": "de" # Sprache auf Deutsch festlegen
    }
    
    try:
        print(f"📡 Scrapingdog Review-Request für ID: {data_id}")
        response = requests.get(URL, params=params)
        
        if response.status_code != 200:
            print(f"❌ API Fehler: Status {response.status_code}")
            return []

        data = response.json()
        
        # Scrapingdog liefert die Liste meist direkt im Feld "reviews"
        raw_reviews = data.get("reviews", [])
        formatted_reviews = []
        
        for rev in raw_reviews:
            # Wir mappen die Scrapingdog-Felder auf unser internes Format
            formatted_reviews.append({
                "author": rev.get("user", {}).get("name") or "Anonym",
                "rating": int(rev.get("rating", 0)),
                "text": rev.get("snippet") or rev.get("text") or "Kein Kommentar",
                "id": rev.get("review_id") or rev.get("id"),
                "date": rev.get("date")
            })
            
            # Limit einhalten
            if len(formatted_reviews) >= max_limit:
                break
                
        print(f"✅ {len(formatted_reviews)} Rezensionen erfolgreich formatiert.")
        return formatted_reviews

    except Exception as e:
        print(f"💥 Kritischer Fehler in reviews.py: {str(e)}")
        return []

# Test-Bereich (optional zum manuellen Testen in der Konsole)
if __name__ == "__main__":
    # Beispiel ID zum Testen
    test_id = "123456789" 
    results = get_google_reviews(test_id)
    print(results)