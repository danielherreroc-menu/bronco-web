#!/usr/bin/env python3
"""Regenera carta/index.html de Bronco a partir de la hoja de Google Sheets.

Esquema de la hoja (pestaña 'menubronco.csv'): grupo, seccion, orden, plato, descripcion, activo, precio
grupo debe ser uno de: Desayunos, Almuerzo y cena, Postres, Bebidas (coincide con los 4 tabs/IDs ya fijos en carta/index.html).
"""
import csv
import html
import io
import os
import re
import sys

SHEET_ID = os.environ.get("SHEET_ID", "1-DVpgI_4d0FNxVIgR-5Qyg6s4nbgt2OjYpXjTogJY_g")
GID = os.environ.get("SHEET_GID", "0")
CARTA_PATH = "carta/index.html"

GROUP_IDS = {
    "Desayunos": "desayunos",
    "Almuerzo y cena": "almuerzo-cena",
    "Postres": "postres",
    "Bebidas": "bebidas",
}


def fetch_rows():
    import google.auth
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        "sa.json",
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"],
    )
    service = build("sheets", "v4", credentials=creds)
    result = service.spreadsheets().values().get(
        spreadsheetId=SHEET_ID, range="menubronco.csv"
    ).execute()
    values = result.get("values", [])
    header = values[0]
    rows = []
    for r in values[1:]:
        row = dict(zip(header, r + [""] * (len(header) - len(r))))
        rows.append(row)
    return rows


def build_item_html(row):
    plato = html.escape(row.get("plato", "").strip())
    desc = html.escape(row.get("descripcion", "").strip())
    precio = row.get("precio", "").strip()
    price_html = f"${html.escape(precio)}" if precio else ""
    desc_html = f"<p>{desc}</p>" if desc else ""
    return f'<article class="menu-item"><h3>{plato}</h3><span class="menu-price">{price_html}</span>{desc_html}</article>'


def build_group_html(rows, grupo):
    items = [r for r in rows if r.get("grupo", "").strip() == grupo and r.get("activo", "").strip().upper() == "SI"]
    if not items:
        return ""
    # conservar orden de aparicion de las secciones, ordenar items por 'orden' dentro de cada seccion
    secciones = []
    for r in items:
        s = r.get("seccion", "").strip()
        if s not in secciones:
            secciones.append(s)
    parts = []
    for s in secciones:
        sec_items = [r for r in items if r.get("seccion", "").strip() == s]
        try:
            sec_items.sort(key=lambda r: float(r.get("orden") or 0))
        except ValueError:
            pass
        parts.append(f'<h3 class="menu-subhead">{html.escape(s)}</h3>')
        parts.extend(build_item_html(r) for r in sec_items)
    return "\n          ".join(parts)


def main():
    rows = fetch_rows()
    with open(CARTA_PATH, encoding="utf-8") as f:
        html_doc = f.read()

    for grupo, gid in GROUP_IDS.items():
        new_list = build_group_html(rows, grupo)
        if not new_list:
            continue
        pattern = re.compile(
            r'(<section class="menu-section" id="' + re.escape(gid) + r'"[^>]*>.*?<div class="menu-list">\n?\s*)(.*?)(\n?\s*</div>\s*</section>)',
            re.DOTALL,
        )
        m = pattern.search(html_doc)
        if not m:
            print(f"AVISO: no se encontró el bloque para grupo '{grupo}' (id={gid})", file=sys.stderr)
            continue
        html_doc = html_doc[: m.start(2)] + "\n          " + new_list + "\n        " + html_doc[m.end(2):]

    with open(CARTA_PATH, "w", encoding="utf-8") as f:
        f.write(html_doc)
    print("carta/index.html actualizado")


if __name__ == "__main__":
    main()
