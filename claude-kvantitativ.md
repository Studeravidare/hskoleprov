# Tillägg: Kvantitativ del

Används tillsammans med `instruktion-1-gemensam.md`.

---

## Provpassstruktur – kvantitativ del

| Kategori | Frågor | Genereras |
| -------- | ------ | --------- |
| XYZ      | 1–12   | ✅        |
| KVA      | 13–22  | ✅        |
| NOG      | 23–28  | ✅        |
| DTK      | 29–40  | ✅        |

---

## Antal svarsalternativ per kategori

| Kategori | Alternativ                                      |
| -------- | ----------------------------------------------- |
| XYZ      | 4 (A–D)                                         |
| KVA      | 4 (A–D)                                         |
| NOG      | 5 (A–E, där E = "ej genom de båda påståendena") |
| DTK      | 4 (A–D)                                         |

---

## XYZ – Matematisk problemlösning

- 4 alternativ (A–D)
- `material_id = null`
- Frågor kan innehålla figurer – se bildregler nedan

---

## KVA – Kvantitativa jämförelser

- 4 alternativ (A–D), alltid samma lydelse:
  - A: I är större än II
  - B: II är större än I
  - C: I är lika med II
  - D: informationen är otillräcklig
- `material_id = null`
- Frågor kan innehålla figurer – se bildregler nedan

---

## NOG – Kvantitativa resonemang

- 5 alternativ (A–E), alltid samma lydelse:
  - A: i (1) men ej i (2)
  - B: i (2) men ej i (1)
  - C: i (1) tillsammans med (2)
  - D: i (1) och (2) var för sig
  - E: ej genom de båda påståendena
- `material_id = null`
- Frågor kan innehålla figurer – se bildregler nedan

---

## DTK – Diagram, tabeller och kartor

- 4 alternativ (A–D)
- Kopplas alltid till ett `materials`-insert via subquery
- `materials.title` ska inkludera frågerange, t.ex. `'Resor med övernattning 29-31'`
- `materials.text_content = null`
- `materials.image_urls = '[]'` – fylls i manuellt efter bilduppladdning

### ⚠️ DTK-frågor har aldrig egen image_url

Sätt alltid `image_url = null` på DTK-frågor. Bildmaterialet tillhör `materials.image_urls`. Undantag: om en enskild fråga har en separat bild som är unik för just den frågan och inte ingår i det gemensamma diagrammet.

```sql
INSERT INTO materials (part, title, text_content, image_urls, year, term, exam_part)
VALUES ('DTK', 'Diagramtitel 29-31', null, '[]', 2024, 'vt', 5);
```

---

## Bildregler för kvantitativ del

### Frågebild (image_url)

Generera URL automatiskt för XYZ/KVA/NOG-frågor som innehåller en figur i frågetexten:

```
https://cbrlsklfpkcehjcbkbnh.supabase.co/storage/v1/object/public/question_specific_images/2024/vt/delprov%205/8.png
```

### Svarsalternativ med bilder

Endast om det med säkerhet framgår av PDF:en att alternativen är bilder (t.ex. geometriska figurer, grafer). Om det är oklart – **be om skärmdump**.

### ⚠️ Anta aldrig att svarsalternativ är bilder

Om alternativens innehåll inte kan läsas tydligt från PDF:en: be om skärmdump. Generera inte bildalternativ på gissning.

---

## Verifiering av matematiska frågor (XYZ, KVA, NOG)

### Steg 1 – Kan uttrycket läsas?

Om frågetext **eller svarsalternativ** inte kan läsas med säkerhet:

- Generera **inte** ett insert
- Lägg frågan i listan över utestående frågor
- **Vänta** med att generera SQL-filen tills alla skärmdumpar har mottagits (se Instruktion i gemensamma regler)

### Steg 2 – Lös och verifiera mot facit

För varje fråga där uttrycket kan läsas: lös frågan och kontrollera att beräknat svar matchar facit **innan insert genereras**.

- Matchar ✅ → generera insert normalt, utan att visa uträkningen
- Matchar inte ❌ → generera **inte** insert. Lägg frågan i listan över utestående frågor med kommentaren "beräknat svar ([X]) matchar inte facit ([Y])" och visa uträkningen. **Vänta** med att generera SQL-filen tills skärmdump har mottagits och verifierats.
