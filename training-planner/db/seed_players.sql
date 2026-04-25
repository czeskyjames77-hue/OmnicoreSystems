-- =====================================================================
-- MSV Zossen Trainer — Spieler-Seed
-- Idempotent: legt 27 Spieler an, falls sie noch nicht existieren,
-- und initialisiert für jeden alle 8 Skills auf 5.00 (Default).
-- Positionen und Trikotnummern bleiben offen; im UI nachpflegen.
-- =====================================================================

with roster(first_name, last_name) as (
  values
    ('Billel', 'Loucif'),
    ('Daniel', 'Hoffmann'),
    ('David', 'Schulz'),
    ('Denis', 'Memetovic'),
    ('Felix', 'Freiberg'),
    ('Florian', 'Kozik'),
    ('Florian', 'Seifert-Danicek'),
    ('James', 'Czesky'),
    ('Jeann', 'Jokiel'),
    ('Justin', 'Schulz'),
    ('Krystian', 'Pastwa'),
    ('Leon', 'Janitschke'),
    ('Louis', 'Creutzburg'),
    ('Malte', 'Jochim'),
    ('Marcel', 'Hampe'),
    ('Mohammad', 'Nowruzi'),
    ('Muharrem', 'Cacan'),
    ('Nick', 'Hamm'),
    ('Nico', 'Hein'),
    ('Niklas', 'Hannemann'),
    ('Pascal', 'Knop'),
    ('Philipp', 'Rülicke'),
    ('Raven', 'Weißberg'),
    ('Steve', ''),
    ('Steven', 'Knape'),
    ('Tobias', 'Dallüge'),
    ('Willi', 'Filipp')
)
insert into players (first_name, last_name)
select r.first_name, r.last_name
from roster r
where not exists (
  select 1 from players p
  where p.first_name = r.first_name and p.last_name = r.last_name
);

-- Default-Skills (5.00) für alle Spieler ohne Skill-Eintrag setzen
insert into player_skills (player_id, category_id, value, floor_value)
select p.id, sc.id, 5.00, 1.00
from players p
cross join skill_categories sc
on conflict (player_id, category_id) do nothing;
