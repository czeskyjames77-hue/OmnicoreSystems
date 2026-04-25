"""FastAPI-Backend für den MSV Zossen Trainer."""
from __future__ import annotations

import os
from datetime import date, datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from db import SessionLocal
from planner import generate_plan
from skills import apply_peer_review_window, apply_training_update

app = FastAPI(title="MSV Zossen Trainer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# =====================================================================
# Schemas
# =====================================================================
class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: Optional[date] = None
    position: Optional[str] = None
    jersey_number: Optional[int] = None


class AttendanceUpdate(BaseModel):
    player_id: str
    status: str = Field(pattern="^(zu|ab|unklar|verletzt)$")


class TrainingCreate(BaseModel):
    scheduled_at: datetime
    location: Optional[str] = None
    duration_minutes: int = 90
    intensity: str = Field(default="mittel", pattern="^(locker|mittel|intensiv)$")
    notes: Optional[str] = None


class ExerciseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    min_players: int = 1
    max_players: int = 30
    duration_minutes: int = 15
    intensity: str = Field(default="mittel", pattern="^(locker|mittel|intensiv)$")
    skill_tags: list[dict] = []  # [{category_id, weight}]


class PeerReviewSubmit(BaseModel):
    rater_id: str
    ratee_id: str
    category_id: str
    rating: float


# =====================================================================
# Health
# =====================================================================
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "msv-zossen-trainer"}


# =====================================================================
# Spieler
# =====================================================================
@app.get("/api/players")
def list_players(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(text("""
        select p.id, p.first_name, p.last_name, p.position, p.jersey_number,
               p.active, p.injured, p.injury_until,
               coalesce(json_object_agg(ps.category_id, ps.value)
                        filter (where ps.category_id is not null), '{}'::json) as skills
        from players p
        left join player_skills ps on ps.player_id = p.id
        group by p.id
        order by p.last_name
    """)).mappings().all()
    return [dict(r) for r in rows]


@app.post("/api/players")
def create_player(body: PlayerCreate, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        text("""
            insert into players (first_name, last_name, birth_date, position, jersey_number)
            values (:fn, :ln, :bd, :pos, :jn)
            returning id
        """),
        {
            "fn": body.first_name, "ln": body.last_name, "bd": body.birth_date,
            "pos": body.position, "jn": body.jersey_number,
        },
    ).mappings().first()
    # Default-Skills initialisieren (5.0)
    db.execute(text("""
        insert into player_skills (player_id, category_id, value, floor_value)
        select :pid, id, 5.0, 1.0 from skill_categories
        on conflict do nothing
    """), {"pid": row["id"]})
    return {"id": str(row["id"])}


# =====================================================================
# Trainings + Anwesenheit
# =====================================================================
@app.get("/api/trainings")
def list_trainings(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(text("""
        select id, scheduled_at, location, duration_minutes, intensity, applied
        from trainings
        order by scheduled_at desc
    """)).mappings().all()
    return [dict(r) for r in rows]


@app.post("/api/trainings")
def create_training(body: TrainingCreate, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        text("""
            insert into trainings (scheduled_at, location, duration_minutes, intensity, notes)
            values (:dt, :loc, :dur, :int, :notes) returning id
        """),
        body.model_dump(),
    ).mappings().first()
    return {"id": str(row["id"])}


@app.get("/api/trainings/{tid}/attendance")
def get_attendance(tid: str, db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(text("""
        select p.id as player_id, p.first_name, p.last_name,
               coalesce(a.status, 'unklar') as status
        from players p
        left join attendance a on a.player_id = p.id and a.training_id = :tid
        where p.active = true
        order by p.last_name
    """), {"tid": tid}).mappings().all()
    return [dict(r) for r in rows]


@app.post("/api/trainings/{tid}/attendance")
def set_attendance(tid: str, body: AttendanceUpdate, db: Session = Depends(get_db)) -> dict:
    db.execute(text("""
        insert into attendance (player_id, training_id, status, responded_at)
        values (:p, :t, :s, now())
        on conflict (player_id, training_id) do update set status = :s, responded_at = now()
    """), {"p": body.player_id, "t": tid, "s": body.status})
    return {"ok": True}


@app.post("/api/trainings/{tid}/apply-skills")
def apply_skills(tid: str, db: Session = Depends(get_db)) -> dict:
    """Wendet die 1%-Mechanik an (nach Trainings-Ende manuell auslösen)."""
    return apply_training_update(db, tid)


# =====================================================================
# Übungen
# =====================================================================
@app.get("/api/exercises")
def list_exercises(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(text("""
        select e.id, e.name, e.description, e.min_players, e.max_players,
               e.duration_minutes, e.intensity,
               coalesce(array_agg(es.category_id) filter (where es.category_id is not null),
                        '{}'::text[]) as skill_tags
        from exercises e
        left join exercise_skills es on es.exercise_id = e.id
        group by e.id
        order by e.name
    """)).mappings().all()
    return [dict(r) for r in rows]


@app.post("/api/exercises")
def create_exercise(body: ExerciseCreate, db: Session = Depends(get_db)) -> dict:
    row = db.execute(text("""
        insert into exercises (name, description, min_players, max_players,
                               duration_minutes, intensity)
        values (:name, :desc, :minp, :maxp, :dur, :int) returning id
    """), {
        "name": body.name, "desc": body.description,
        "minp": body.min_players, "maxp": body.max_players,
        "dur": body.duration_minutes, "int": body.intensity,
    }).mappings().first()
    for tag in body.skill_tags:
        db.execute(text("""
            insert into exercise_skills (exercise_id, category_id, weight)
            values (:e, :c, :w)
            on conflict do nothing
        """), {"e": row["id"], "c": tag["category_id"], "w": tag.get("weight", 1.0)})
    return {"id": str(row["id"])}


# =====================================================================
# Plan-Generator
# =====================================================================
@app.get("/api/trainings/{tid}/suggested-plan")
def suggested_plan(tid: str, target_minutes: int = 75,
                   db: Session = Depends(get_db)) -> dict:
    return generate_plan(db, tid, target_minutes=target_minutes)


# =====================================================================
# Peer-Review
# =====================================================================
@app.get("/api/peer-reviews/active")
def active_window(db: Session = Depends(get_db)) -> Optional[dict]:
    row = db.execute(text("""
        select id, label, starts_at, ends_at, status
        from peer_review_windows
        where status = 'open'
        order by starts_at desc limit 1
    """)).mappings().first()
    return dict(row) if row else None


@app.post("/api/peer-reviews")
def submit_review(body: PeerReviewSubmit, db: Session = Depends(get_db)) -> dict:
    window = db.execute(text("""
        select id from peer_review_windows where status = 'open'
        order by starts_at desc limit 1
    """)).mappings().first()
    if not window:
        raise HTTPException(400, "Kein aktives Review-Fenster")
    if body.rater_id == body.ratee_id:
        raise HTTPException(400, "Selbsteinschätzung nicht erlaubt")
    db.execute(text("""
        insert into peer_reviews (window_id, rater_id, ratee_id, category_id, rating)
        values (:w, :r, :t, :c, :v)
        on conflict (window_id, rater_id, ratee_id, category_id)
        do update set rating = excluded.rating, created_at = now()
    """), {
        "w": window["id"], "r": body.rater_id, "t": body.ratee_id,
        "c": body.category_id, "v": body.rating,
    })
    return {"ok": True}


@app.post("/api/peer-reviews/windows/{wid}/close")
def close_window(wid: str, db: Session = Depends(get_db)) -> dict:
    return apply_peer_review_window(db, wid)


# =====================================================================
# Skill-Kategorien
# =====================================================================
@app.get("/api/skill-categories")
def list_categories(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(text(
        "select id, name, description from skill_categories order by name"
    )).mappings().all()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8001")))
