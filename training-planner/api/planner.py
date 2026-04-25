"""Regel-basierter Trainingsplan-Generator.

Wählt Übungen aus dem Katalog, die zu den schwächsten Skills des anwesenden
Teams passen und die Spielerzahl-Constraints erfüllen.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


def generate_plan(db: Session, training_id: str, target_minutes: int = 75,
                  top_weak_skills: int = 3) -> dict[str, Any]:
    """Gibt eine Liste vorgeschlagener Übungen zurück.

    Strategie:
      1. Bestimme anwesende Spieler ('zu') für das Training.
      2. Finde die `top_weak_skills` Skill-Kategorien mit dem niedrigsten
         Team-Mittelwert (nur über anwesende Spieler).
      3. Wähle Übungen, die mind. eine dieser Kategorien als Tag haben,
         und in deren min/max-Spielerzahl das Team passt.
      4. Fülle bis `target_minutes` Trainingszeit erreicht ist.
    """
    present = db.execute(
        text(
            "select player_id from attendance where training_id = :tid and status = 'zu'"
        ),
        {"tid": training_id},
    ).scalars().all()

    n_players = len(present)
    if n_players == 0:
        return {"status": "no_attendees", "items": []}

    # Schwächste Team-Skills (Mittelwert über Anwesende)
    weak = db.execute(
        text(
            """
            select ps.category_id, sc.name, avg(ps.value) as avg_value
            from player_skills ps
            join skill_categories sc on sc.id = ps.category_id
            where ps.player_id = any(:players)
            group by ps.category_id, sc.name
            order by avg_value asc
            limit :limit
            """
        ),
        {"players": present, "limit": top_weak_skills},
    ).mappings().all()

    weak_ids = [w["category_id"] for w in weak]
    if not weak_ids:
        return {"status": "no_skills_data", "items": []}

    # Passende Übungen
    candidates = db.execute(
        text(
            """
            select e.id, e.name, e.duration_minutes, e.intensity,
                   array_agg(es.category_id) as skills
            from exercises e
            join exercise_skills es on es.exercise_id = e.id
            where e.min_players <= :n and e.max_players >= :n
              and es.category_id = any(:weak)
            group by e.id, e.name, e.duration_minutes, e.intensity
            order by e.duration_minutes
            """
        ),
        {"n": n_players, "weak": weak_ids},
    ).mappings().all()

    chosen: list[dict] = []
    total_minutes = 0
    used_skills: set[str] = set()
    # Erst Übungen wählen, die noch nicht abgedeckte Schwächen treffen
    for c in candidates:
        if total_minutes >= target_minutes:
            break
        new_skills = set(c["skills"]) & set(weak_ids) - used_skills
        if not new_skills and used_skills.issuperset(weak_ids):
            continue
        chosen.append({
            "exercise_id": str(c["id"]),
            "name": c["name"],
            "duration_minutes": c["duration_minutes"],
            "intensity": c["intensity"],
            "skills": list(c["skills"]),
            "addresses_weakness": list(new_skills) if new_skills else [],
        })
        total_minutes += c["duration_minutes"]
        used_skills.update(c["skills"])

    return {
        "status": "ok",
        "training_id": training_id,
        "n_players": n_players,
        "weak_skills": [{"id": w["category_id"], "name": w["name"],
                         "avg": float(w["avg_value"])} for w in weak],
        "total_minutes": total_minutes,
        "items": chosen,
    }
