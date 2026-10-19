"""Generate the website vocabulary from wordlibrary.xlsx using Python 3 only.

Run: python scripts/sync-wordlibrary.py
Validate without writing: python scripts/sync-wordlibrary.py --check
Duplicate words are intentionally preserved.
"""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_words(path):
    with ZipFile(path) as book:
        strings = []
        if "xl/sharedStrings.xml" in book.namelist():
            strings = ["".join(item.itertext()) for item in
                       ET.fromstring(book.read("xl/sharedStrings.xml")).findall("m:si", NS)]
        workbook = ET.fromstring(book.read("xl/workbook.xml"))
        sheet = next(s for s in workbook.findall("m:sheets/m:sheet", NS)
                     if s.get("name") == "wordlibrary")
        rid = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        rels = ET.fromstring(book.read("xl/_rels/workbook.xml.rels"))
        target = next(r.get("Target") for r in rels if r.get("Id") == rid)
        sheet_path = target.lstrip("/") if target.startswith("/") else "xl/" + target
        data = ET.fromstring(book.read(sheet_path))
        words = []
        for row in data.findall("m:sheetData/m:row", NS):
            if row.get("r") == "1":
                continue
            values = {}
            for cell in row.findall("m:c", NS):
                column = "".join(c for c in cell.get("r") if c.isalpha())
                if cell.get("t") == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall("m:is//m:t", NS))
                else:
                    value = cell.findtext("m:v", "", NS)
                    if cell.get("t") == "s":
                        value = strings[int(value)]
                values[column] = value
            if not values.get("B", "").strip():
                # Existing source has an unnamed record (05234); the website
                # has always excluded it. Preserve it in Excel, skip in JSON.
                continue
            if not all(values.get(c, "").strip() for c in "BCDE"):
                raise ValueError(f"Incomplete vocabulary row {row.get('r')}")
            words.append(dict(zip(("word", "phonetic", "zh", "ja"),
                                  (values[c] for c in "BCDE"))))
        if not words:
            raise ValueError("Vocabulary is empty")
        return words


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    words = read_words(ROOT / "wordlibrary.xlsx")
    output = ROOT / "wordlibrary.json"
    if args.check:
        if json.loads(output.read_text(encoding="utf-8")) != words:
            raise SystemExit("wordlibrary.json is stale; run python scripts/sync-wordlibrary.py")
        print(f"OK: Excel and JSON contain the same {len(words)} entries")
    else:
        output.write_text(json.dumps(words, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"Synced {len(words)} entries to wordlibrary.json")


if __name__ == "__main__":
    main()
