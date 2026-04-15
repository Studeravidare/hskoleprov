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

| Bildtyp            | Filnamn              | Exempel (vt2024 provpass 5) |
| ------------------ | -------------------- | --------------------------- |
| Bild i frågetexten | `{frågenummer}.png`  | `12.png`                    |
| Svarsalternativ A  | `{frågenummer}a.png` | `9a.png`                    |
| Svarsalternativ B  | `{frågenummer}b.png` | `9b.png`                    |
| Svarsalternativ C  | `{frågenummer}c.png` | `9c.png`                    |
| Svarsalternativ D  | `{frågenummer}d.png` | `9d.png`                    |

Label i filnamnet är alltid **gemen** (a, b, c, d).

**Fullständiga exempel:**

```
-- Frågebild för Q12, vt2024 provpass 5:
https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2024/vt/delprov%205/12.png

-- Svarsalternativ C för Q9, vt2024 provpass 5:
https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2024/vt/delprov%205/9c.png
```

### Vad genereras automatiskt vs. manuellt

| Fält                   | Strategi                                           |
| ---------------------- | -------------------------------------------------- |
| `questions.image_url`  | Genereras automatiskt utifrån URL-mönstret         |
| `options[i].image`     | Genereras automatiskt utifrån URL-mönstret         |
| `materials.image_urls` | Alltid `'[]'` – fylls i manuellt efter uppladdning |

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
  { "image": "https://.../9a.png" },
  { "image": "https://.../9b.png" },
  { "image": "https://.../9c.png" },
  { "image": "https://.../9d.png" }
]
```

### Blandat (text + bild i samma fråga)

```json
[
  { "text": "A: textalternativ" },
  { "image": "https://.../5b.png" },
  { "text": "C: textalternativ" },
  { "image": "https://.../5d.png" }
]
```

---

## SQL-format

Filen är uppdelad i **två separata block** som körs i ordning:

1. Först alla `INSERT INTO materials`
2. Sedan alla `INSERT INTO questions`

### ⚠️ Använd ALDRIG CTE-namn i questions-inserts

Koppla alltid `material_id` via subquery direkt mot `materials`-tabellen:

```sql
(SELECT id FROM materials
 WHERE title = 'Textens rubrik'
   AND year = 2024 AND term = 'vt' AND exam_part = 5)
```

### Del 1 – Materials

```sql
-- LÄS-material:
INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
VALUES ('LÄS', 'Textens rubrik', $$Hela texten här...$$, null, 2024, 'vt', 4);

-- DTK-material:
INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
VALUES ('DTK', 'Diagramtitel 29-31', null, '[]', 2024, 'vt', 5);
```

### Del 2 – Questions

```sql
INSERT INTO questions
  (year, term, exam_part, category, question_number, image_url,
   question_text, options, correct_index, explanation, material_id)
VALUES (2024, 'vt', 5, 'XYZ', 1, null,
  'Frågetext här',
  '[{"text":"A: ..."},{"text":"B: ..."},{"text":"C: ..."},{"text":"D: ..."}]',
  0, 'Förklaring här.', null);
```

---

## Generella regler

- **UUID**: Aldrig manuella UUID:s – låt databasen skapa dem automatiskt
- **correct_index**: Alltid 0-baserat (A=0, B=1, C=2, D=3, E=4)
- **Facit**: Hämta alltid rätt svar från det bifogade facit-PDF:et
- **question_number**: Ska alltid matcha det nummer som är tryckt i provhäftet – räkna aldrig utifrån position i PDF:en
- **ORD, MEK, XYZ, KVA, NOG**: `material_id = null`

---

## Hantering av oläsbart innehåll

Om frågetext **eller svarsalternativ** inte kan läsas med säkerhet från PDF:en:

- Generera **inte** ett insert för den frågan
- Notera frågan i listan över utestående frågor: **"Fråga [nr] – [anledning]"**
- **Generera inte SQL-filen** förrän alla utestående frågor är lösta (se Instruktion nedan)

**Viktigt:** Anta aldrig att svarsalternativ är bilder utan att ha sett dem. Om alternativens innehåll är oklart från PDF:en – be om skärmdump.

---

## Sammanfattad lista i slutet av varje körning

Avsluta alltid med:

```
## Kräver manuell åtgärd

### materials.image_urls som ska fyllas i:
| Material            | Täcker frågor |
|---------------------|---------------|
| Ejder i skärgården  | Q32–34        |

### Frågor som behöver skärmdump (ej genererade):
| Fråga | Anledning                                |
|-------|------------------------------------------|
| Q6    | Svarsalternativ oklara i PDF             |
| Q18   | Beräknat svar (X) matchar inte facit (Y) |
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

## Instruktion

När du tar emot ett provhäfte (PDF) + facit (PDF):

1. Läs provhäftet och identifiera alla texter och frågor
2. Hämta rätt svar från facit
3. Om **inga** frågor kräver skärmdump: generera direkt en komplett `.sql`-fil och leverera den som nedladdningsbar output
4. Om **en eller flera** frågor kräver skärmdump:
   - Generera **inte** SQL-filen ännu
   - Lista alla frågor som behöver skärmdump (med anledning), t.ex.:
     ```
     Följande frågor kunde inte tolkas – skicka skärmdumpar så genererar jag SQL-filen:
     - Fråga 7: svarsalternativ oklara i PDF
     - Fråga 14: beräknat svar (3) matchar inte facit (4) – se uträkning nedan
     ```
   - Vänta på att användaren skickar skärmdumparna
5. När skärmdumpar har mottagits: tolka dem, verifiera mot facit vid behov, och kontrollera att **alla** utestående frågor nu är lösta
   - Om fler frågor fortfarande är oklara: be om ytterligare skärmdumpar och vänta igen
   - När alla frågor är lösta: generera den kompletta `.sql`-filen
6. Koppla `material_id` alltid via subquery – aldrig via CTE-namn
7. Avsluta med sammanfattningen "Kräver manuell åtgärd"
8. Leverera filen som nedladdningsbar output
