"""Logik für die 1%-Skill-Mechanik.

Regeln:
- Anwesende Spieler bekommen pro Training Skill-Steigerung in den Kategorien,
  die durch die Übungen abgedeckt sind. Steigerung = current * (1 + base * weight).
- Intensität bestimmt base:   locker 0.005 / mittel 0.010 / intensiv 0.015.
- Cap bei 10.0.
- Abwesende Spieler (Status 'ab', NICHT 'verletzt') verlieren 0.3% auf alle
  Skills, mit Floor (player_skills.floor_value).
- Verletzte Spieler (Status 'verletzt') werden ignoriert.
- Jede Änderung wird in skill_history geloggt.
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

INTENSITY_BASE = {
    "locker": 0.005,
    "mittel": 0.010,
    "intensiv": 0.015,
}

ABSENCE_DECAY = 0.003  # 0.3% Verlust pro verpasstem Training
SKILL_CAP = 10.0


def apply_training_update(db: Session, training_id: str) -> dict:
    """Wendet die 1%-Mechanik für ein Training an. Idempotent über `applied`-Flag."""
    training = db.execute(
        text("select id, intensity, applied from trainings where id = :tid"),
        {"tid": training_id},
    ).mappings().first()
    if not training:
        raise ValueError(f"Training {training_id} nicht gefunden")
    if training["applied"]:
        return {"status": "already_applied", "training_id": training_id}

    base_pct = INTENSITY_BASE.get(training["intensity"], 0.010)

    # Welche Skill-Kategorien werden trainiert (mit Gewichtung) — über alle Übungen aggregiert
    skill_weights = db.execute(
        text(
            """
            select es.category_id, max(es.weight) as weight
            from training_plan_items tpi
            join exercise_skills es on es.exercise_id = tpi.exercise_id
            where tpi.training_id = :tid
            group by es.category_id
            """
        ),
        {"tid": training_id},
    ).mappings().all()

    if not skill_weights:
        return {"status": "no_exercises", "training_id": training_id}

    # Anwesende und abwesende Spieler
    attendees = db.execute(
        text(
            "select player_id, status from attendance where training_id = :tid"
        ),
        {"tid": training_id},
    ).mappings().all()

    present = [a["player_id"] for a in attendees if a["status"] == "zu"]
    absent = [a["player_id"] for a in attendees if a["status"] == "ab"]

    updates = 0

    # Steigerung für anwesende Spieler in trainierten Skills
    for player_id in present:
        for sw in skill_weights:
            cat = sw["category_id"]
            weight = float(sw["weight"])
            row = db.execute(
                text(
                    "select value from player_skills where player_id = :p and category_id = :c"
                ),
                {"p": player_id, "c": cat},
            ).mappings().first()
            current = float(row["value"]) if row else 5.0
            new_val = min(SKILL_CAP, current * (1 + base_pct * weight))
            _upsert_skill(db, player_id, cat, new_val)
            _log_history(
                db, player_id, cat, current, new_val,
                source="training", source_ref=training_id,
                note=f"Intensität {training['intensity']}, Gewicht {weight}",
            )
            updates += 1

    # Regression für abwesende Spieler in allen Skills
    for player_id in absent:
        skills = db.execute(
            text("select category_id, value, floor_value from player_skills where player_id = :p"),
            {"p": player_id},
        ).mappings().all()
        for s in skills:
            current = float(s["value"])
            floor = float(s["floor_value"])
            new_val = max(floor, current * (1 - ABSENCE_DECAY))
            if new_val < current:
                _upsert_skill(db, player_id, s["category_id"], new_val)
                _log_history(
                    db, player_id, s["category_id"], current, new_val,
                    source="absence", source_ref=training_id,
                    note="unentschuldigte/normale Abwesenheit",
                )
                updates += 1

    db.execute(
        text("update trainings set applied = true, applied_at = now() where id = :tid"),
        {"tid": training_id},
    )

    return {"status": "ok", "training_id": training_id, "updates": updates,
            "present": len(present), "absent": len(absent)}


def apply_peer_review_window(db: Session, window_id: str) -> dict:
    """Schließt ein Peer-Review-Fenster: Mittelwert je Spieler/Kategorie wird zum
    neuen player_skills.value (und floor_value = 50% davon).
    Mindestens 3 Bewertungen nötig, sonst keine Anpassung."""
    window = db.execute(
        text("select id, status, applied from peer_review_windows where id = :w"),
        {"w": window_id},
    ).mappings().first()
    if not window:
        raise ValueError(f"Window {window_id} nicht gefunden")
    if window["applied"]:
        return {"status": "already_applied", "window_id": window_id}

    rows = db.execute(
        text(
            """
            select ratee_id, category_id, avg(rating) as avg_rating, count(*) as n
            from peer_reviews
            where window_id = :w
            group by ratee_id, category_id
            having count(*) >= 3
            """
        ),
        {"w": window_id},
    ).mappings().all()

    updates = 0
    for r in rows:
        new_val = float(r["avg_rating"])
        floor = round(new_val * 0.5, 2)
        prev = db.execute(
            text("select value from player_skills where player_id = :p and category_id = :c"),
            {"p": r["ratee_id"], "c": r["category_id"]},
        ).mappings().first()
        before = float(prev["value"]) if prev else 5.0
        _upsert_skill(db, r["ratee_id"], r["category_id"], new_val, floor=floor)
        _log_history(
            db, r["ratee_id"], r["category_id"], before, new_val,
            source="peer_review", source_ref=window_id,
            note=f"Peer-Review n={r['n']}",
        )
        updates += 1

    db.execute(
        text("update peer_review_windows set applied = true, status = 'closed' where id = :w"),
        {"w": window_id},
    )
    return {"status": "ok", "window_id": window_id, "updates": updates}


def _upsert_skill(db: Session, player_id: str, category_id: str, value: float,
                  floor: float | None = None) -> None:
    if floor is None:
        db.execute(
            text(
                """
                insert into player_skills (player_id, category_id, value, updated_at)
                values (:p, :c, :v, now())
                on conflict (player_id, category_id)
                do update set value = excluded.value, updated_at = now()
                """
            ),
            {"p": player_id, "c": category_id, "v": round(value, 2)},
        )
    else:
        db.execute(
            text(
                """
                insert into player_skills (player_id, category_id, value, floor_value, updated_at)
                values (:p, :c, :v, :f, now())
                on conflict (player_id, category_id)
                do update set value = excluded.value, floor_value = excluded.floor_value, updated_at = now()
                """
            ),
            {"p": player_id, "c": category_id, "v": round(value, 2), "f": round(floor, 2)},
        )


def _log_history(db: Session, player_id: str, category_id: str,
                 before: float, after: float, source: str,
                 source_ref: str | None, note: str) -> None:
    delta = (after - before) / before if before > 0 else 0
    db.execute(
        text(
            """
            insert into skill_history
              (player_id, category_id, before_value, after_value, delta_pct, source, source_ref, note)
            values (:p, :c, :b, :a, :d, :s, :ref, :n)
            """
        ),
        {
            "p": player_id, "c": category_id,
            "b": round(before, 2), "a": round(after, 2),
            "d": round(delta, 4),
            "s": source, "ref": source_ref, "n": note,
        },
    )
