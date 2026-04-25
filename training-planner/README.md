# MSV Zossen Trainer

Web-App für den Amateur-Fußballverein **MSV Zossen** zur Trainingsplanung mit
adaptivem Trainingsplan, individuellen Spieler-Skills und 1%-Konzept.

> Dieses Projekt liegt isoliert im Unterordner `training-planner/` und teilt
> sich nichts mit dem übrigen Repo. Es kann jederzeit als eigenständiges Repo
> herausgelöst werden.

## Konzept

- **Spieler-Profile** mit 8 Skill-Kategorien (Passspiel, Schuss, Zweikampf,
  Kondition, Schnelligkeit, Technik, Kopfball, Spielverständnis), Werte 1.00–10.00.
- **Trainings** mit Anwesenheits-Erfassung pro Spieler.
- **Übungskatalog** mit Skill-Tags und Min/Max-Spielerzahlen.
- **Adaptiver Trainingsplan-Generator**: schlägt Übungen vor, die zu den
  schwächsten Skills der **anwesenden** Spieler passen.
- **1%-Konzept** (multiplikativ, Cap bei 10.0):
  - locker × 1.005 / mittel × 1.010 / intensiv × 1.015 — pro Trainings-Tag
    auf alle Skills der durchgeführten Übungen.
  - Abwesende verlieren 0.3% (`× 0.997`) auf alle Skills, mit Floor.
  - Verletzte (Status `verletzt`) sind ausgenommen.
- **Peer-Review** alle 6 Monate: jeder Spieler bewertet jeden Mitspieler in
  jeder Kategorie (anonym, keine Selbstbewertung). Mindestens 3 Bewertungen
  pro Kombination → Mittelwert wird neuer Skill-Wert, Floor = 50% davon.
- **Taktik-Board**: Spielfeld mit ziehbaren Spielern und Pfeilen für Laufwege
  und Spieleröffnungen (react-konva).

## Stack

- Frontend: Vite + React 18 + TypeScript + TailwindCSS + react-konva
- Backend: FastAPI + SQLAlchemy + Postgres (Supabase-kompatibel)
- KI (geplant für Phase 4): Claude API für Übungsvorschläge aus Taktik-Skizzen

## Verzeichnisstruktur

```
training-planner/
├── api/                FastAPI-Backend
│   ├── main.py         Endpoints (Spieler, Trainings, Anwesenheit, …)
│   ├── skills.py       1%-Mechanik + Peer-Review-Anwendung
│   ├── planner.py      Regel-basierter Trainingsplan-Generator
│   ├── db.py           SQLAlchemy-Setup
│   └── requirements.txt
├── db/
│   └── schema.sql      Datenbank-Schema + Seed-Daten
├── src/                React-Frontend
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/Layout.tsx
│   ├── lib/api.ts
│   └── pages/
│       ├── HomePage.tsx
│       ├── PlayersPage.tsx
│       ├── TrainingsPage.tsx
│       ├── TrainingDetailPage.tsx
│       ├── AttendancePage.tsx
│       ├── ExercisesPage.tsx
│       ├── TacticsPage.tsx
│       └── PeerReviewPage.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Lokales Setup

### 1. Datenbank (Supabase oder lokales Postgres)

Lege ein Supabase-Projekt an (oder starte ein lokales Postgres) und führe
`db/schema.sql` aus:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### 2. Backend

```bash
cd training-planner/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://..."
uvicorn main:app --reload --port 8001
```

API läuft auf `http://localhost:8001`. Health-Check: `GET /api/health`.

### 3. Frontend

```bash
cd training-planner
npm install
cp .env.example .env.local   # API-URL anpassen
npm run dev
```

Frontend läuft auf `http://localhost:5174`.

## Roadmap

### Phase 1 – Basis (umgesetzt)
- [x] Spieler-CRUD + Skill-Profile (8 Kategorien)
- [x] Trainings anlegen + Anwesenheit
- [x] Übungskatalog mit Skill-Tags
- [x] Trainingsplan-Generator (regelbasiert)
- [x] 1%-Mechanik (Anwesenheits-Boost, Abwesenheits-Regression, Cap)
- [x] Peer-Review-System (halbjährlich)
- [x] Taktik-Board (Drag & Drop, Pfeile)

### Phase 2 – Verfeinerung
- [ ] Authentifizierung (Trainer vs. Spieler)
- [ ] PDF-Export für Trainingspläne
- [ ] Skill-History-Visualisierung pro Spieler
- [ ] Verletzungs-Management (Zeiträume, automatisches Re-Aktivieren)
- [ ] Spielfeld-Layouts speichern/laden

### Phase 3 – KI-Integration
- [ ] Claude API: aus Taktik-Skizze + Schwächen → Übungsvorschläge
- [ ] Begründungen für jeden Trainingsplan
- [ ] Spielanalyse-Auswertung → automatische Schwächen-Erkennung

## API-Endpoints (Auswahl)

| Methode | Pfad                                          | Zweck                                 |
| :------ | :-------------------------------------------- | :------------------------------------ |
| GET     | `/api/players`                                | Spielerliste mit Skills               |
| POST    | `/api/players`                                | Spieler anlegen (Default-Skills 5.0)  |
| GET     | `/api/trainings`                              | Alle Trainings                        |
| POST    | `/api/trainings`                              | Training anlegen                      |
| GET     | `/api/trainings/{id}/attendance`              | Anwesenheit eines Trainings           |
| POST    | `/api/trainings/{id}/attendance`              | Status setzen (zu/ab/unklar/verletzt) |
| GET     | `/api/trainings/{id}/suggested-plan`          | Plan-Vorschlag generieren             |
| POST    | `/api/trainings/{id}/apply-skills`            | 1%-Mechanik anwenden (idempotent)     |
| GET     | `/api/exercises`                              | Übungskatalog                         |
| POST    | `/api/exercises`                              | Übung anlegen                         |
| GET     | `/api/peer-reviews/active`                    | Aktives Bewertungsfenster             |
| POST    | `/api/peer-reviews`                           | Bewertung abgeben                     |
| POST    | `/api/peer-reviews/windows/{id}/close`        | Fenster schließen, Werte anwenden     |
| GET     | `/api/skill-categories`                       | Skill-Stammdaten                      |
