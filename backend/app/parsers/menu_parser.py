"""Turn the text of a menu PDF into categories and items.

This is a simple line-by-line heuristic, not a perfect parser. The party leader
reviews and fixes the result before the menu is published.
"""

import re
from dataclasses import dataclass
from decimal import Decimal

import pymupdf

MAX_PAGES = 20
DEFAULT_CATEGORY = "Menu"

KNOWN_CATEGORIES = {
    "starters",
    "starter",
    "appetizers",
    "mezze",
    "salads",
    "soups",
    "mains",
    "main courses",
    "main course",
    "grill",
    "sides",
    "desserts",
    "drinks",
    "beverages",
    "hot drinks",
    "soft drinks",
}

# A price is a number at the end of the line. It needs a currency symbol or a
# decimal part, so "12 pieces" is not mistaken for a price.
PRICE_WITH_SYMBOL = re.compile(r"[£$€₺]\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*$")
PRICE_WITH_SYMBOL_AFTER = re.compile(r"(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:[£$€₺]|TL)\s*$")
PRICE_WITH_DECIMALS = re.compile(r"(\d{1,4}[.,]\d{1,2})\s*$")


class MenuParseError(Exception):
    pass


@dataclass
class ParsedItem:
    category: str
    name: str
    description: str | None
    price: Decimal


def extract_text(pdf_bytes: bytes) -> str:
    try:
        document = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as error:
        raise MenuParseError("Unable to parse this PDF.") from error

    with document:
        if document.page_count > MAX_PAGES:
            raise MenuParseError(f"PDF has too many pages (max {MAX_PAGES}).")
        text = "\n".join(page.get_text() for page in document)

    if not text.strip():
        raise MenuParseError(
            "This PDF has no readable text. Scanned PDFs are not supported yet."
        )
    return text


def split_price(line: str) -> tuple[str, Decimal] | None:
    """Return (text before the price, price) or None if the line has no price."""
    for pattern in (PRICE_WITH_SYMBOL, PRICE_WITH_SYMBOL_AFTER, PRICE_WITH_DECIMALS):
        match = pattern.search(line)
        if match:
            price = Decimal(match.group(1).replace(",", "."))
            # Remove dot leaders and dashes between the name and the price.
            before = line[: match.start()].rstrip(" .-–—:\t")
            return before, price
    return None


def is_category(line: str) -> bool:
    words = line.rstrip(":").split()
    if not words or len(words) > 4 or any(c.isdigit() for c in line):
        return False
    return (
        line.rstrip(":").lower() in KNOWN_CATEGORIES
        or line.endswith(":")
        or (line.isupper() and len(line) > 2)
    )


def clean_category(line: str) -> str:
    name = line.rstrip(":").strip()
    return name.title() if name.isupper() else name


def parse_menu_text(text: str) -> list[ParsedItem]:
    items: list[ParsedItem] = []
    category = DEFAULT_CATEGORY
    pending: list[str] = []  # unpriced lines since the last item
    last_item: ParsedItem | None = None

    def flush_pending():
        # Lines after an item (name + price on one line) are its description.
        if pending and last_item is not None:
            last_item.description = " ".join(pending)[:500]
        pending.clear()

    for raw_line in text.splitlines():
        line = " ".join(raw_line.split())
        if not line:
            continue

        priced = split_price(line)
        if priced is not None:
            name, price = priced
            if name:
                flush_pending()
                description = None
            elif pending:
                # Price on its own line: the lines before it are name + description.
                name = pending[0]
                description = " ".join(pending[1:])[:500] or None
                pending.clear()
            else:
                continue
            last_item = ParsedItem(category, name[:100], description, price)
            items.append(last_item)
        elif is_category(line):
            flush_pending()
            category = clean_category(line)[:50]
            last_item = None
        else:
            pending.append(line)

    flush_pending()
    return items


def parse_menu_pdf(pdf_bytes: bytes) -> list[ParsedItem]:
    return parse_menu_text(extract_text(pdf_bytes))
