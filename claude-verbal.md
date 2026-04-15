# Tillägg: Verbal del

Används tillsammans med `instruktion-1-gemensam.md`.

---

## Provpassstruktur – verbal del

| Kategori | Frågor | Genereras               |
| -------- | ------ | ----------------------- |
| ORD      | 1–10   | ✅                      |
| LÄS      | 11–20  | ✅                      |
| MEK      | 21–30  | ✅                      |
| ELF      | 31–40  | ❌ Aldrig – upphovsrätt |

---

## Antal svarsalternativ per kategori

| Kategori | Alternativ       |
| -------- | ---------------- |
| ORD      | 5 (A–E)          |
| LÄS      | 4 (A–D)          |
| MEK      | 4 (A–D)          |
| ELF      | Genereras aldrig |

---

## ORD

- 5 alternativ (A–E)
- `material_id = null`
- Frågetexten är ett enstaka ord, t.ex. `'basal'`
- Svarsalternativen är synonymer/definitioner som textalternativ

---

## LÄS

- 4 alternativ (A–D)
- Kopplas alltid till ett `materials`-insert via subquery
- Hela texten läggs in i `text_content` med `$$...$$`
- `image_urls = null` (LÄS har inga bilder)
- Rubriken i `materials.title` ska vara enbart textens rubrik – **utan frågenummer**

```sql
INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
VALUES ('LÄS', 'Textens rubrik', $$Hela texten här...$$, null, 2024, 'vt', 1);
```

---

## MEK

- 4 alternativ (A–D)
- `material_id = null`
- Frågetexten innehåller en mening med ett ord markerat för ifyllnad
- Svarsalternativen är textalternativ

---

## ELF – upphovsrätt

**ELF genereras aldrig.** Upphovsrättsskyddat material som inte kan publiceras.

Nämn alltid i sammanfattningen att ELF är utelämnat. Be aldrig om komplettering.

```
## Kräver manuell åtgärd
ELF (Q31–40) är utelämnat – upphovsrättsskyddat material.
```

---

## Bilder i verbal del

Verbala frågor innehåller mycket sällan bilder. Om ett svarsalternativ eller en frågetext ser ut att innehålla en bild i PDF:en – be om skärmdump innan insert genereras. Anta aldrig att alternativ är bilder.
