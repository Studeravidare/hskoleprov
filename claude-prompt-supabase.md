# KONTEXT: Högskoleprovet – Supabase SQL-generator

## Uppgift

Jag har en Supabase-databas för högskoleprovet. Du ska ta emot PDF:er med provhäften + facit och generera SQL-inserts i rätt format.

---

## Databastabeller

### `materials`

| Kolumn       | DB-typ      | Beskrivning                                                                                                                                             |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id           | uuid        | Auto-genereras av databasen                                                                                                                             |
| part         | text        | `'LÄS'` eller `'DTK'`                                                                                                                                   |
| title        | text        | Textens rubrik. För DTK: inkludera alltid frågerange i titeln, t.ex. `'Ejder i Stockholms skärgård 32-34'`. För LÄS: enbart rubriken, utan frågenummer. |
| image_urls   | jsonb       | Array med bild-URLs (DTK). Alltid `'[]'` – fylls i manuellt efter uppladdning                                                                           |
| text_content | text        | Brödtext (LÄS). `null` för DTK                                                                                                                          |
| created_at   | timestamptz | Auto-sätts av databasen                                                                                                                                 |
| year         | int4        | T.ex. `2025`                                                                                                                                            |
| term         | text        | `'vt'` eller `'ht'`                                                                                                                                     |
| exam_part    | int4        | Provpassnummer (1–5)                                                                                                                                    |

### `questions`

| Kolumn          | DB-typ    | Beskrivning                                                            |
| --------------- | --------- | ---------------------------------------------------------------------- |
| id              | uuid      | Auto-genereras av databasen                                            |
| year            | int4      | T.ex. `2025`                                                           |
| term            | text      | `'vt'` eller `'ht'`                                                    |
| exam_part       | int4      | Provpassnummer (1–5)                                                   |
| category        | text      | `'ORD'`, `'LÄS'`, `'MEK'`, `'ELF'`, `'XYZ'`, `'KVA'`, `'NOG'`, `'DTK'` |
| question_number | int4      | Frågans nummer i provet                                                |
| image_url       | text      | URL till frågans bild. `null` om frågan saknar bild                    |
| question_text   | text      | Frågetexten                                                            |
| options         | jsonb     | Se format nedan                                                        |
| correct_index   | int4      | 0-baserat index för rätt svar                                          |
| explanation     | text      | Förklaring till rätt svar                                              |
| material_id     | uuid      | FK till `materials.id`. `null` om frågan ej har material               |
| created_at      | timestamp | Auto-sätts av databasen                                                |

---

## Bild-URL:er – struktur och regler

### Vad genereras automatiskt vs. manuellt

| Fält                   | Strategi                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `questions.image_url`  | **Genereras automatiskt** utifrån URL-mönstret                                                                      |
| `options[i].image_url` | **Genereras automatiskt** utifrån URL-mönstret                                                                      |
| `materials.image_urls` | **Alltid `'[]'`** – DTK-diagram kan delas upp i flera bilder vid uppladdning, så dessa fylls i manuellt i efterhand |

---

### Bucket: `question_specific_images`

Används för `questions.image_url` och `options[i].image_url`.

**Bas-URL:**

```
https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images
```

**Sökväg:**

```
/{år}/{termin}/delprov%20{provpass}/{filnamn}.png
```

**Filnamnsregler:**

| Bildtyp            | Filnamn              | Exempel (vt2025 provpass 3) |
| ------------------ | -------------------- | --------------------------- |
| Bild i frågetexten | `{frågenummer}.png`  | `12.png`                    |
| Svarsalternativ A  | `{frågenummer}a.png` | `9a.png`                    |
| Svarsalternativ B  | `{frågenummer}b.png` | `9b.png`                    |
| Svarsalternativ C  | `{frågenummer}c.png` | `9c.png`                    |
| Svarsalternativ D  | `{frågenummer}d.png` | `9d.png`                    |

Label i filnamnet är alltid **gemen** (a, b, c, d).

**Fullständiga exempel:**

```
-- Frågebild för Q12, vt2025 provpass 3:
https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/12.png

-- Svarsalternativ C för Q9, vt2025 provpass 3:
https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9c.png
```

**Regel: Fyll alltid i dessa URL:er direkt i SQL. Lämna aldrig `null` när år/termin/provpass/frågenummer är kända.**

---

## Format för `options` (jsonb)

### Textalternativ

```json
[
  { "text": "A: alternativ" },
  { "text": "B: alternativ" },
  { "text": "C: alternativ" },
  { "text": "D: alternativ" }
]
```

### Bildalternativ

```json
[
  {
    "image_url": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9a.png",
    "label": "A"
  },
  {
    "image_url": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9b.png",
    "label": "B"
  },
  {
    "image_url": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9c.png",
    "label": "C"
  },
  {
    "image_url": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9d.png",
    "label": "D"
  }
]
```

### Blandat (text + bild i samma fråga)

```json
[
  { "text": "A: textalternativ" },
  {
    "image_url": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/5b.png",
    "label": "B"
  },
  { "text": "C: textalternativ" },
  {
    "image_url": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/5d.png",
    "label": "D"
  }
]
```

---

## SQL-format (viktigt!)

Använd alltid CTE-mönster med `RETURNING id` för materials:

```sql
WITH
-- LÄS-material (text, ingen bild):
mat_las AS (
  INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
  VALUES ('LÄS', 'Textens rubrik', $$Hela texten här...$$, null, 2025, 'vt', 2)
  RETURNING id
),
-- DTK-material (bild – image_urls alltid null, fylls i manuellt):
mat_dtk AS (
  INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
  VALUES ('DTK', 'Diagramtitel', null, '[]', 2025, 'vt', 3)
  RETURNING id
)

INSERT INTO questions
  (year, term, exam_part, category, question_number, image_url,
   question_text, options, correct_index, explanation, material_id)
VALUES

-- Fråga med textbaserade alternativ, inget material:
(2025, 'vt', 2, 'ORD', 1, null,
 'basal',
 '[{"text":"A: hållbar"},{"text":"B: underförstådd"},{"text":"C: vardaglig"},{"text":"D: grundläggande"},{"text":"E: genomtänkt"}]',
 3, 'Basal betyder grundläggande.', null),

-- Fråga med bild i frågetexten:
(2025, 'vt', 3, 'XYZ', 12,
 'https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/12.png',
 'Hur stor är den skuggade arean?',
 '[{"text":"A: 2π cm²"},{"text":"B: 2,5π cm²"},{"text":"C: 3π cm²"},{"text":"D: 3,5π cm²"}]',
 1, 'Förklaring.', null),

-- Fråga med bildbaserade alternativ:
(2025, 'vt', 3, 'XYZ', 9, null,
 'Linjen L har ekvationen y + 2x − 2 = 0. Vilket svarsalternativ visar linjen L?',
 '[{"image_url":"https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9a.png","label":"A"},
   {"image_url":"https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9b.png","label":"B"},
   {"image_url":"https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9c.png","label":"C"},
   {"image_url":"https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9d.png","label":"D"}]',
 2, 'y = −2x + 2: riktningskoefficient −2 och y-intercept 2.', null),

-- Fråga med LÄS-material:
(2025, 'vt', 2, 'LÄS', 11, null,
 'Frågetexten här?',
 '[{"text":"A: alternativ"},{"text":"B: alternativ"},{"text":"C: alternativ"},{"text":"D: alternativ"}]',
 2, 'Förklaring.', (SELECT id FROM mat_las));
```

---

## Regler

- **UUID**: Aldrig manuella UUID:s – låt databasen skapa dem via CTE
- **correct_index**: Alltid 0-baserat (A=0, B=1, C=2, D=3, E=4)
- **ORD**: 5 alternativ (A–E)
- **LÄS, MEK, ELF, DTK**: 4 alternativ (A–D)
- **XYZ, KVA**: 4 alternativ (A–D)
- **NOG**: 5 alternativ (A–E, där E = "ej möjligt att avgöra")
- **LÄS-texter**: Lägg in hela texten i `text_content`, använd `$$...$$`
- **DTK-material**: `text_content = null`, `image_urls = '[]'` (fylls i manuellt)
- **ORD, MEK, XYZ, KVA, NOG**: `material_id = null`
- **Facit**: Hämta alltid rätt svar från det bifogade facit-PDF:et
- **Fråge- och alternativbilder**: Generera URL direkt – lämna aldrig `null` när år/termin/provpass/frågenummer är kända

---

## Hantering av otolkbara matematiska uttryck

- Om ett matematiskt uttryck inte kan tolkas med säkerhet från PDF-texten: **generera inte ett gissningsvis insert**
- Skriv istället: **"Fråga [nr] kunde inte tolkas – kan du skicka en skärmdump?"**
- Fortsätt med övriga frågor, samla alla otolkbara i slutlistan

---

## Sammanfattad lista i slutet av varje körning

Avsluta alltid med:

```
## Kräver manuell åtgärd

### materials.image_urls som ska fyllas i:
| Material        | Täcker frågor |
|-----------------|---------------|
| mat_ejder       | Q32–34        |
| mat_hp_resultat | Q35–37        |

### Frågor som behöver skärmdump (ej genererade):
| Fråga | Anledning                          |
|-------|------------------------------------|
| Q3    | Matematiskt uttryck oläsbart i PDF |
```

Om inga frågor saknades och inga material behöver påminnas om:

```
## Kräver manuell åtgärd
Fyll i image_urls för DTK-material efter bilduppladdning (se materials-CTE:erna ovan).
```

---

## Provpassstruktur (verbal del)

| Kategori | Frågor | Provpass |
| -------- | ------ | -------- |
| ORD      | 1–10   | Verbal   |
| LÄS      | 11–20  | Verbal   |
| MEK      | 21–30  | Verbal   |
| ELF      | 31–40  | Verbal   |

## Provpassstruktur (kvantitativ del)

| Kategori | Frågor | Provpass    |
| -------- | ------ | ----------- |
| XYZ      | 1–12   | Kvantitativ |
| KVA      | 13–22  | Kvantitativ |
| NOG      | 23–28  | Kvantitativ |
| DTK      | 29–40  | Kvantitativ |

---

## Instruktion

När jag skickar ett provhäfte (PDF) + facit (PDF), ska du:

1. Läsa provhäftet och identifiera alla texter och frågor
2. Hämta rätt svar från facit
3. För varje fråga – avgör om frågetext eller svarsalternativ innehåller bilder och bygg URL:en direkt
4. DTK-material: sätt alltid `image_urls = null`
5. Verifiera matematiska uttryck – be om skärmdump vid tvekan
6. Generera en komplett `.sql`-fil med CTE-mönstret ovan
7. Avsluta med sammanfattningen "Kräver manuell åtgärd"
8. Leverera filen som nedladdningsbar output
