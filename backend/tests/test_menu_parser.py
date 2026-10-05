from decimal import Decimal

import pymupdf
import pytest

from app.parsers.menu_parser import MenuParseError, parse_menu_pdf, parse_menu_text

SAMPLE_MENU = """\
STARTERS
Hummus £6.50
Chickpea, tahini, lemon
Lahmacun .......... 5.50
MAIN COURSES
Adana Kebab - £15.00
Minced lamb, grilled pepper
Sides:
Rice 3
Chips 3.5 TL
Drinks
Coke €2,50
"""


def make_pdf(text: str) -> bytes:
    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((50, 72), text, fontsize=11)
    return document.tobytes()


def test_parse_menu_text():
    items = parse_menu_text(SAMPLE_MENU)
    rows = [(i.category, i.name, i.description, i.price) for i in items]
    assert rows == [
        ("Starters", "Hummus", "Chickpea, tahini, lemon", Decimal("6.50")),
        ("Starters", "Lahmacun", None, Decimal("5.50")),
        (
            "Main Courses",
            "Adana Kebab",
            "Minced lamb, grilled pepper",
            Decimal("15.00"),
        ),
        ("Sides", "Chips", None, Decimal("3.5")),
        ("Drinks", "Coke", None, Decimal("2.50")),
    ]


def test_price_needs_symbol_or_decimals():
    # "Rice 3" has no symbol or decimals, so it is not read as an item.
    names = [i.name for i in parse_menu_text(SAMPLE_MENU)]
    assert "Rice" not in names


def test_price_on_its_own_line():
    items = parse_menu_text("Starters\nHummus\nChickpea, tahini\n6.50\n")
    assert len(items) == 1
    assert items[0].name == "Hummus"
    assert items[0].description == "Chickpea, tahini"
    assert items[0].price == Decimal("6.50")


def test_items_without_category_use_default():
    items = parse_menu_text("Hummus 6.50\n")
    assert items[0].category == "Menu"


def test_text_without_prices_gives_no_items():
    assert parse_menu_text("Welcome to our restaurant\nOpen daily") == []


def test_parse_menu_pdf():
    items = parse_menu_pdf(make_pdf("STARTERS\nHummus £6.50\nLahmacun £5.50"))
    assert [(i.category, i.name, i.price) for i in items] == [
        ("Starters", "Hummus", Decimal("6.50")),
        ("Starters", "Lahmacun", Decimal("5.50")),
    ]


def test_invalid_pdf():
    with pytest.raises(MenuParseError, match="Unable to parse this PDF"):
        parse_menu_pdf(b"%PDF-1.4 this is not really a pdf")


def test_pdf_without_text():
    document = pymupdf.open()
    document.new_page()
    with pytest.raises(MenuParseError, match="no readable text"):
        parse_menu_pdf(document.tobytes())


def test_price_without_any_name_is_ignored():
    assert parse_menu_text("6.50\n") == []


def test_pdf_with_too_many_pages():
    document = pymupdf.open()
    for _ in range(21):
        document.new_page().insert_text((50, 72), "Hummus 6.50")
    with pytest.raises(MenuParseError, match="too many pages"):
        parse_menu_pdf(document.tobytes())
