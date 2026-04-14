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
| `options[i].image`     | **Genereras automatiskt** utifrån URL-mönstret                                                                      |
| `materials.image_urls` | **Alltid `'[]'`** – DTK-diagram kan delas upp i flera bilder vid uppladdning, så dessa fylls i manuellt i efterhand |

---

### Bucket: `question_specific_images`

Används för `questions.image_url` och `options[i].image`.

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

### ⚠️ DTK-frågor har aldrig egen image_url

DTK-frågor har alltid `image_url = null` på frågenivå. Bildmaterialet tillhör `materials.image_urls`, inte `questions.image_url`. Sätt aldrig en URL på en DTK-fråga såvida inte frågan innehåller en separat bild som är unik för just den frågan och inte ingår i det gemensamma diagrammet/tabellen. (Kan fortfarande ha svar som bilder)

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
    "image": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9a.png"
  },
  {
    "image": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9b.png"
  },
  {
    "image": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9c.png"
  },
  {
    "image": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/9d.png"
  }
]
```

### Blandat (text + bild i samma fråga)

```json
[
  { "text": "A: textalternativ" },
  {
    "image": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/5b.png"
  },
  { "text": "C: textalternativ" },
  {
    "image": "https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2025/vt/delprov%203/5d.png"
  }
]
```

---

## SQL-format (viktigt!)

Filen är uppdelad i **två separata block** som körs i ordning:

1. Först alla `INSERT INTO materials` (en per text/diagram)
2. Sedan alla `INSERT INTO questions` (en per fråga)

### ⚠️ Kritisk regel: Använd ALDRIG CTE-namn i questions-inserts

CTEs (`WITH mat_x AS (...)`) lever bara inom den SQL-sats de definierades i.
En separat `INSERT INTO questions` kan **inte** referera till `mat_x` – det ger felet `relation "mat_x" does not exist`.

**Rätt sätt att koppla material_id** är via subquery direkt mot `materials`-tabellen:

```sql
(SELECT id FROM materials
 WHERE title = 'Textens rubrik'
   AND year = 2025 AND term = 'vt' AND exam_part = 4)
```

### Del 1 – Materials

Varje material är ett eget `INSERT`-statement. Ingen CTE behövs.

```sql
-- LÄS-material (text, ingen bild):
INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
VALUES ('LÄS', 'Textens rubrik', $$Hela texten här...$$, null, 2025, 'vt', 4);

-- DTK-material (bild – image_urls = '[]', fylls i manuellt):
INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
VALUES ('DTK', 'Diagramtitel 29-31', null, '[]', 2025, 'vt', 3);
```

### Del 2 – Questions

Varje fråga är ett eget `INSERT`-statement. `material_id` sätts alltid via subquery:

```sql
INSERT INTO questions
  (year, term, exam_part, category, question_number, image_url,
   question_text, options, correct_index, explanation, material_id)
VALUES (2025, 'vt', 4, 'LÄS', 11, null,
  'Vad visar exemplet Gun Widmark?',
  '[{"text":"A: ..."},{"text":"B: ..."},{"text":"C: ..."},{"text":"D: ..."}]',
  2, 'Förklaring här.',
  (SELECT id FROM materials WHERE title = 'Textens rubrik' AND year = 2025 AND term = 'vt' AND exam_part = 4));

-- ORD/MEK/XYZ/KVA/NOG har inget material – sätt null:
INSERT INTO questions
  (year, term, exam_part, category, question_number, image_url,
   question_text, options, correct_index, explanation, material_id)
VALUES (2025, 'vt', 4, 'ORD', 1, null,
  'basal',
  '[{"text":"A: hållbar"},{"text":"B: underförstådd"},{"text":"C: vardaglig"},{"text":"D: grundläggande"},{"text":"E: genomtänkt"}]',
  3, 'Basal betyder grundläggande.', null);
```

---

## Regler

- **UUID**: Aldrig manuella UUID:s – låt databasen skapa dem automatiskt
- **correct_index**: Alltid 0-baserat (A=0, B=1, C=2, D=3, E=4)
- **ORD**: 5 alternativ (A–E)
- **LÄS, MEK, ELF, DTK**: 4 alternativ (A–D)
- **XYZ, KVA**: 4 alternativ (A–D)
- **NOG**: 5 alternativ (A–E, där E = "ej möjligt att avgöra")
- **LÄS-texter**: Lägg in hela texten i `text_content`, använd `$$...$$`
- **DTK-material**: `text_content = null`, `image_urls = '[]'` (fylls i manuellt)
- **ORD, MEK, XYZ, KVA, NOG**: `material_id = null`
- **Facit**: Hämta alltid rätt svar från det bifogade facit-PDF:et
- **ELF (Q31–40 i verbal del)**: Genereras aldrig – upphovsrättsskyddat material som inte kan publiceras. Nämn i sammanfattningen att ELF är utelämnat, be aldrig om komplettering.
- **Fråge- och alternativbilder**: Generera URL direkt – lämna aldrig `null` när år/termin/provpass/frågenummer är kända
- **question_number**: Ska alltid matcha det nummer som är tryckt i provhäftet. Räkna aldrig frågenummer utifrån position i PDF:en – PDF-layout kan avvika från faktisk numrering.

---

## Hantering av otolkbara matematiska uttryck

- Om ett matematiskt uttryck inte kan tolkas med säkerhet från PDF-texten: **generera inte ett gissningsvis insert**
- Skriv istället: **"Fråga [nr] kunde inte tolkas – kan du skicka en skärmdump?"**
- Fortsätt med övriga frågor, samla alla otolkbara i slutlistan

### ⚠️ Verifiera alltid beräknat svar mot facit

För varje matematisk fråga (XYZ, KVA, NOG) där uttrycket kan läsas: **lös frågan och kontrollera att beräknat svar matchar facit-svaret** innan insert genereras.

- Om beräknat svar **matchar** facit → generera insert normalt, **utan** att visa uträkningen
- Om beräknat svar **inte matchar** facit → generera **inte** ett insert. Skriv istället: **"Fråga [nr] – beräknat svar ([X]) matchar inte facit ([Y]). Kan du skicka en skärmdump?"** och visa uträkningen som visade avvikelsen. Samla frågan i slutlistan.

Detta fångar fall där PDF-layouten förvrängt uttrycket tillräckligt för att ge en felaktig tolkning, även när texten till synes är läsbar.

---

## Sammanfattad lista i slutet av varje körning

Avsluta alltid med:

```
## Kräver manuell åtgärd

### materials.image_urls som ska fyllas i:
| Material            | Täcker frågor |
|---------------------|---------------|
| Ejder i skärgården  | Q32–34        |
| HP-resultat         | Q35–37        |

### Frågor som behöver skärmdump (ej genererade):
| Fråga | Anledning                                        |
|-------|--------------------------------------------------|
| Q3    | Matematiskt uttryck oläsbart i PDF               |
| Q18   | Beräknat svar (X) matchar inte facit (Y)         |
```

Om inga frågor saknades och inga DTK-material finns:

```
## Kräver manuell åtgärd
Inga DTK-material i detta provpass. Inga frågor saknas.
```

Om DTK-material finns men inga frågor saknas:

```
## Kräver manuell åtgärd
Fyll i image_urls för DTK-material efter bilduppladdning (se materials-inserts ovan).
```

---

## Provpassstruktur (verbal del)

| Kategori | Frågor | Provpass | Genereras               |
| -------- | ------ | -------- | ----------------------- |
| ORD      | 1–10   | Verbal   | ✅                      |
| LÄS      | 11–20  | Verbal   | ✅                      |
| MEK      | 21–30  | Verbal   | ✅                      |
| ELF      | 31–40  | Verbal   | ❌ Aldrig – upphovsrätt |

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
3. För varje fråga – avgör om frågetext eller svarsalternativ innehåller bilder och bygg URL:en direkt. **DTK-frågor får aldrig image_url på frågenivå (se regel ovan).**
4. DTK-material: sätt alltid `image_urls = '[]'`
5. För varje matematisk fråga: lös den och verifiera att beräknat svar matchar facit – be om skärmdump om de inte stämmer
6. Generera en komplett `.sql`-fil med strukturen: materials-inserts först, questions-inserts sedan
7. Koppla `material_id` i questions alltid via subquery mot `materials`-tabellen – aldrig via CTE-namn
8. Avsluta med sammanfattningen "Kräver manuell åtgärd"
9. Leverera filen som nedladdningsbar output
