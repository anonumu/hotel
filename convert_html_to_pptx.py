"""
Конвертер HTML-презентации Grand Impérial Hotel PMS (38 слайдов)
в нативный редактируемый файл PowerPoint (.pptx, 16:9 widescreen).

Вход:  presentation_grand_imperial.html
Выход: Grand_Imperial_Hotel_PMS_Presentation.pptx
"""

import html
import math
import re
from pathlib import Path
from typing import List, Optional, Tuple

from bs4 import BeautifulSoup, NavigableString, Tag
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls, qn
from pptx.util import Inches, Pt

BASE_DIR = Path(__file__).resolve().parent
HTML_PATH = BASE_DIR / "presentation_grand_imperial.html"
PPTX_PATH = BASE_DIR / "Grand_Imperial_Hotel_PMS_Presentation.pptx"

# Размеры слайда 16:9 (13.333" x 7.5")
SLIDE_W_IN = 13.333
SLIDE_H_IN = 7.5

# Базовая палитра Obsidian & Indigo
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
C_TEXT_MAIN = RGBColor(0xF1, 0xF5, 0xF9)
C_TEXT_MUTED = RGBColor(0x94, 0xA3, 0xB8)
C_TEXT_DIM = RGBColor(0x64, 0x74, 0x8B)
C_TEXT_CODE = RGBColor(0xE2, 0xE8, 0xF0)

C_INDIGO = RGBColor(0x63, 0x66, 0xF1)
C_INDIGO_LIGHT = RGBColor(0xA5, 0xB4, 0xFC)
C_INDIGO_SOFT = RGBColor(0x81, 0x8C, 0xF8)
C_CYAN = RGBColor(0x38, 0xBD, 0xF8)
C_EMERALD = RGBColor(0x34, 0xD3, 0x99)
C_AMBER = RGBColor(0xFB, 0xBF, 0x24)
C_RED = RGBColor(0xF8, 0x71, 0x71)

C_CARD_BG = RGBColor(0x11, 0x18, 0x27)
C_CARD_BORDER = RGBColor(0x23, 0x2F, 0x45)
C_CARD_HI_BG = RGBColor(0x17, 0x1A, 0x3D)
C_CARD_HI_BORDER = RGBColor(0x52, 0x55, 0xC4)

C_TAG_BG = RGBColor(0x16, 0x1B, 0x3C)
C_TAG_BORDER = RGBColor(0x43, 0x47, 0xA8)
C_FOOTER_LINE = RGBColor(0x1E, 0x29, 0x3B)

C_CODE_BG = RGBColor(0x03, 0x07, 0x12)
C_CODE_BORDER = RGBColor(0x1F, 0x29, 0x37)

C_PM_CARD_BG = RGBColor(0x0F, 0x17, 0x2A)
C_PM_CARD_BORDER = RGBColor(0x33, 0x41, 0x55)
C_PM_TOPBAR_BG = RGBColor(0x1E, 0x29, 0x3B)
C_PM_BODY_BG = RGBColor(0x02, 0x06, 0x17)

C_TBL_TH_BG = RGBColor(0x1A, 0x24, 0x38)
C_TBL_TD_BG1 = RGBColor(0x0D, 0x14, 0x24)
C_TBL_TD_BG2 = RGBColor(0x11, 0x1A, 0x2E)

FONT_UI = "Segoe UI"
FONT_MONO = "Consolas"
FONT_EMOJI = "Segoe UI Emoji"

BADGE_PALETTES = {
    "badge-success": (RGBColor(0x0D, 0x2D, 0x25), RGBColor(0x19, 0x67, 0x4D), C_EMERALD),
    "badge-primary": (RGBColor(0x18, 0x1D, 0x46), RGBColor(0x47, 0x4B, 0xAA), C_INDIGO_LIGHT),
    "badge-warning": (RGBColor(0x2D, 0x22, 0x0E), RGBColor(0x7C, 0x56, 0x13), C_AMBER),
    "badge-danger": (RGBColor(0x2F, 0x14, 0x1B), RGBColor(0x88, 0x2A, 0x30), C_RED),
    "badge-neutral": (RGBColor(0x29, 0x35, 0x48), RGBColor(0x47, 0x55, 0x69), RGBColor(0xE2, 0xE8, 0xF0)),
}

METHOD_COLORS = {
    "method-get": RGBColor(0x02, 0x84, 0xC7),
    "method-post": RGBColor(0x16, 0xA3, 0x4A),
    "method-delete": RGBColor(0xDC, 0x26, 0x26),
    "method-patch": RGBColor(0x93, 0x33, 0xEA),
}

METHOD_CELL_TINTS = {
    "method-get": (RGBColor(0x0C, 0x2A, 0x3E), RGBColor(0x38, 0xBD, 0xF8)),
    "method-post": (RGBColor(0x0B, 0x2C, 0x1E), RGBColor(0x4A, 0xDE, 0x80)),
    "method-delete": (RGBColor(0x31, 0x13, 0x19), RGBColor(0xF8, 0x71, 0x71)),
    "method-patch": (RGBColor(0x27, 0x14, 0x3A), RGBColor(0xC0, 0x84, 0xFC)),
}


def parse_hex_color(s: Optional[str]) -> Optional[RGBColor]:
    if not s:
        return None
    m = re.search(r"#([0-9a-fA-F]{6})", s)
    if m:
        hx = m.group(1)
        return RGBColor(int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))
    m_rgba = re.search(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", s)
    if m_rgba:
        return RGBColor(int(m_rgba.group(1)), int(m_rgba.group(2)), int(m_rgba.group(3)))
    return None


def parse_css_prop_color(style: Optional[str], prop: str) -> Optional[RGBColor]:
    """Извлекает цвет строго конкретного CSS-свойства (например, 'color', но не 'background' или 'border')."""
    if not style:
        return None
    m = re.search(rf"(?:^|;)\s*{re.escape(prop)}\s*:\s*([^;]+)", style, flags=re.I)
    if not m:
        return None
    return parse_hex_color(m.group(1))


def clean_ws(text: str) -> str:
    text = html.unescape(text).replace("\xa0", " ")
    return re.sub(r"[ \t\r\n]+", " ", text)


def disable_shadow(shape) -> None:
    shape.shadow.inherit = False
    spPr = shape._element.spPr
    for eff in spPr.findall(qn("a:effectLst")):
        spPr.remove(eff)
    spPr.append(parse_xml(f"<a:effectLst {nsdecls('a')}/>"))


def set_rounded_radius(shape, w_in: float, h_in: float, radius_in: float = 0.14) -> None:
    min_dim = max(min(w_in, h_in), 0.01)
    adj = min(0.5, radius_in / min_dim)
    try:
        shape.adjustments[0] = adj
    except Exception:
        pass


def set_slide_gradient_bg(slide, c1_hex: str, c2_hex: str) -> None:
    bg = slide.background
    bgPr = bg._element.get_or_add_bgPr()
    for child in list(bgPr):
        bgPr.remove(child)
    grad_xml = f"""
    <a:gradFill {nsdecls('a')} flip="none" rotWithShape="1">
      <a:gsLst>
        <a:gs pos="0"><a:srgbClr val="{c1_hex}"/></a:gs>
        <a:gs pos="60000"><a:srgbClr val="{c2_hex}"/></a:gs>
        <a:gs pos="100000"><a:srgbClr val="{c1_hex}"/></a:gs>
      </a:gsLst>
      <a:lin ang="2700000" scaled="1"/>
    </a:gradFill>
    """
    bgPr.append(parse_xml(grad_xml))


def set_cell_border(cell, hex_color: str = "243044", width_emu: int = 6350) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    for tag in ("a:lnL", "a:lnR", "a:lnT", "a:lnB"):
        for old in tcPr.findall(qn(tag)):
            tcPr.remove(old)
        ln_xml = (
            f'<{tag} {nsdecls("a")} w="{width_emu}" cap="flat" cmpd="sng" algn="ctr">'
            f'<a:solidFill><a:srgbClr val="{hex_color}"/></a:solidFill>'
            f'<a:prstDash val="solid"/>'
            f'</{tag}>'
        )
        tcPr.append(parse_xml(ln_xml))


def clear_table_default_style(table) -> None:
    tblPr = table._tbl.tblPr
    for child in list(tblPr):
        if child.tag.endswith("tableStyleId"):
            tblPr.remove(child)
    tblPr.set("firstRow", "1")
    tblPr.set("bandRow", "0")


def ui_line_pt(font_pt: float) -> float:
    return round(font_pt * 1.34, 1)


def mono_line_pt(font_pt: float) -> float:
    return round(font_pt * 1.24, 1)


def _char_em_width(ch: str, is_mono: bool = False, bold: bool = False) -> float:
    if is_mono:
        return 0.56
    if ch == "—":
        w = 0.98
    elif ch in " .,;:!|'\"()[]{}/\\-ilItfjrг":
        w = 0.295
    elif ch in "mwжшщфюыMWЖШЩФЮЫ":
        w = 0.68
    elif ch.isupper():
        w = 0.64
    elif ord(ch) > 127 and not ("а" <= ch.lower() <= "я" or ch.lower() == "ё"):
        w = 0.65
    else:
        w = 0.526
    return w * (1.09 if bold else 1.0)


def estimate_text_lines(
    text: str,
    font_pt: float,
    width_in: float,
    is_mono: bool = False,
    bold: bool = False,
    mono_ratio: float = 0.0,
) -> int:
    if not text:
        return 1
    if is_mono:
        factor = 0.60
        avg_char_in = (font_pt * factor) / 72.0
        chars_per_line = max(int(width_in / avg_char_in), 10)
        total = 0
        for para in text.split("\n"):
            p = para.rstrip()
            if not p:
                total += 1
            else:
                total += max(1, math.ceil(len(p) / chars_per_line))
        return max(1, total)

    max_em = max((width_in * 72.0) / max(font_pt, 1.0), 6.0)
    space_em = _char_em_width(" ", is_mono=False, bold=bold)
    total = 0
    for para in text.split("\n"):
        p = para.rstrip()
        if not p:
            total += 1
            continue
        words = p.split(" ")
        cur_em = 0.0
        lines = 1
        for w in words:
            w_em = sum(_char_em_width(c, is_mono=(mono_ratio > 0.6), bold=bold) for c in w)
            if mono_ratio > 0.05 and mono_ratio <= 0.6:
                w_em = w_em * (1.0 - mono_ratio) + (len(w) * 0.56) * mono_ratio
            if cur_em == 0.0:
                if w_em <= max_em:
                    cur_em = w_em
                else:
                    extra = max(0, math.ceil(w_em / max_em) - 1)
                    lines += extra
                    cur_em = w_em - extra * max_em
            elif cur_em + space_em + w_em <= max_em:
                cur_em += space_em + w_em
            else:
                lines += 1
                if w_em <= max_em:
                    cur_em = w_em
                else:
                    extra = max(0, math.ceil(w_em / max_em) - 1)
                    lines += extra
                    cur_em = w_em - extra * max_em
        total += lines
    return max(1, total)


def estimate_block_h(
    text: str,
    font_pt: float,
    width_in: float,
    is_mono: bool = False,
    bold: bool = False,
    mono_ratio: float = 0.0,
) -> float:
    lines = estimate_text_lines(
        text, font_pt, width_in, is_mono=is_mono, bold=bold, mono_ratio=mono_ratio
    )
    lp = mono_line_pt(font_pt) if is_mono else ui_line_pt(font_pt)
    return lines * (lp / 72.0)


def add_rect(
    slide,
    x_in: float,
    y_in: float,
    w_in: float,
    h_in: float,
    fill: Optional[RGBColor] = None,
    border: Optional[RGBColor] = None,
    border_pt: float = 1.0,
    rounded: bool = False,
    radius_in: float = 0.14,
):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    shp = slide.shapes.add_shape(shape_type, Inches(x_in), Inches(y_in), Inches(w_in), Inches(h_in))
    disable_shadow(shp)
    if rounded:
        set_rounded_radius(shp, w_in, h_in, radius_in)
    if fill is not None:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    else:
        shp.fill.background()
    if border is not None:
        shp.line.color.rgb = border
        shp.line.width = Pt(border_pt)
    else:
        shp.line.fill.background()
    return shp


def add_textbox(
    slide,
    x_in: float,
    y_in: float,
    w_in: float,
    h_in: float,
    text: str = "",
    font_size: float = 11.0,
    color: RGBColor = C_TEXT_MUTED,
    bold: bool = False,
    italic: bool = False,
    font_name: str = FONT_UI,
    align: PP_ALIGN = PP_ALIGN.LEFT,
    anchor: MSO_ANCHOR = MSO_ANCHOR.TOP,
    line_pt: Optional[float] = None,
    word_wrap: bool = True,
):
    tb = slide.shapes.add_textbox(Inches(x_in), Inches(y_in), Inches(w_in), Inches(h_in))
    tf = tb.text_frame
    tf.word_wrap = word_wrap
    tf.margin_left = Inches(0)
    tf.margin_right = Inches(0)
    tf.margin_top = Inches(0)
    tf.margin_bottom = Inches(0)
    tf.vertical_anchor = anchor
    if text:
        p = tf.paragraphs[0]
        p.alignment = align
        p.line_spacing = Pt(line_pt if line_pt is not None else ui_line_pt(font_size))
        r = p.add_run()
        r.text = text
        r.font.name = font_name
        r.font.size = Pt(font_size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.color.rgb = color
    return tb


def collect_inline_runs(
    node,
    bold: bool = False,
    italic: bool = False,
    code: bool = False,
    color: Optional[RGBColor] = None,
) -> List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]:
    """Разбирает inline-узел HTML в список кортежей (текст, bold, italic, code, color)."""
    out: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]] = []
    if isinstance(node, NavigableString):
        txt = clean_ws(str(node))
        if txt:
            out.append((txt, bold, italic, code, color))
        return out
    if not isinstance(node, Tag):
        return out

    name = node.name.lower()
    if name == "br":
        out.append(("\n", bold, italic, code, color))
        return out

    classes = node.get("class", []) or []
    style = node.get("style") or ""
    style_col = parse_css_prop_color(style, "color")
    next_color = style_col or color
    next_bold = bold or (name in ("strong", "b")) or ("font-weight:700" in style.replace(" ", ""))
    next_italic = italic or (name in ("em", "i"))
    next_code = code or (name == "code")

    if "badge" in classes:
        b_txt = clean_ws(node.get_text())
        b_col = next_color
        for k, (_, _, tc) in BADGE_PALETTES.items():
            if k in classes:
                b_col = tc
                break
        if b_txt:
            out.append((f"[{b_txt}]", True, False, True, b_col or C_INDIGO_LIGHT))
        return out

    if next_code and not next_color:
        next_color = RGBColor(0x93, 0xC5, 0xFD)

    for ch in node.children:
        out.extend(collect_inline_runs(ch, next_bold, next_italic, next_code, next_color))
    return out


def write_runs_to_paragraph(
    p,
    runs: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]],
    base_size: float,
    default_color: RGBColor,
    base_bold: bool = False,
    font_override: Optional[str] = None,
) -> None:
    cleaned: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]] = []
    for txt, b, it, cd, col in runs:
        if cleaned and cleaned[-1][0].endswith("\n") and txt.startswith(" "):
            txt = txt.lstrip(" ")
        if cleaned and cleaned[-1][0].endswith(" ") and txt == " ":
            continue
        if not txt:
            continue
        cleaned.append((txt, b, it, cd, col))

    for idx, (txt, b, it, cd, col) in enumerate(cleaned):
        if idx == 0:
            txt = txt.lstrip(" ")
        if not txt:
            continue
        r = p.add_run()
        r.text = txt
        r.font.name = FONT_MONO if cd else (font_override or FONT_UI)
        r.font.size = Pt(max(base_size - 0.5, 8.0) if cd else base_size)
        r.font.bold = b or base_bold
        r.font.italic = it
        r.font.color.rgb = col or default_color


def add_header_footer(slide, slide_el: Tag, slide_idx: int, total_slides: int, footer_text: str) -> None:
    tag_el = slide_el.select_one(".header-tag")
    title_el = slide_el.select_one(".slide-title")
    sub_el = slide_el.select_one(".slide-subtitle")

    tag_txt = clean_ws(tag_el.get_text()) if tag_el else ""
    title_txt = clean_ws(title_el.get_text()) if title_el else ""
    sub_txt = clean_ws(sub_el.get_text()) if sub_el else ""

    tag_w = max(1.15, min(3.8, len(tag_txt) * 0.088 + 0.36))
    pill = add_rect(
        slide, 0.55, 0.25, tag_w, 0.26,
        fill=C_TAG_BG, border=C_TAG_BORDER, border_pt=0.85,
        rounded=True, radius_in=0.07
    )
    tf_p = pill.text_frame
    tf_p.word_wrap = False
    tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = Inches(0)
    tf_p.vertical_anchor = MSO_ANCHOR.MIDDLE
    pp = tf_p.paragraphs[0]
    pp.alignment = PP_ALIGN.CENTER
    rp = pp.add_run()
    rp.text = tag_txt.upper()
    rp.font.name = FONT_UI
    rp.font.size = Pt(8.0)
    rp.font.bold = True
    rp.font.color.rgb = C_INDIGO_LIGHT

    add_textbox(
        slide, 8.10, 0.25, 4.68, 0.28,
        text="Grand Impérial PMS  •  Java 21 • Spring Boot 2.7 • Security",
        font_size=8.5, color=C_TEXT_DIM, font_name=FONT_MONO, align=PP_ALIGN.RIGHT,
        anchor=MSO_ANCHOR.MIDDLE, word_wrap=False
    )

    title_font = 20.5 if len(title_txt) <= 58 else 18.5
    add_textbox(
        slide, 0.55, 0.57, 12.23, 0.34,
        text=title_txt, font_size=title_font, color=C_WHITE, bold=True, line_pt=title_font * 1.15
    )
    add_textbox(
        slide, 0.55, 0.92, 12.23, 0.26,
        text=sub_txt, font_size=10.5, color=C_TEXT_MUTED, line_pt=12.5
    )

    add_rect(slide, 0.55, 1.24, 12.233, 0.01, fill=C_FOOTER_LINE)
    add_footer(slide, footer_text, slide_idx, total_slides)


def add_footer(slide, footer_text: str, slide_idx: int, total_slides: int) -> None:
    add_rect(slide, 0.55, 6.95, 12.233, 0.01, fill=C_FOOTER_LINE)
    dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.55), Inches(7.13), Inches(0.075), Inches(0.075))
    disable_shadow(dot)
    dot.fill.solid()
    dot.fill.fore_color.rgb = C_INDIGO
    dot.line.fill.background()

    add_textbox(
        slide, 0.70, 7.05, 10.6, 0.25,
        text=footer_text, font_size=9.0, color=C_TEXT_MUTED, bold=True, anchor=MSO_ANCHOR.MIDDLE
    )

    num_badge = add_rect(
        slide, 11.88, 7.04, 0.90, 0.26,
        fill=RGBColor(0x14, 0x1A, 0x3A), border=RGBColor(0x31, 0x35, 0x7A), border_pt=0.75,
        rounded=True, radius_in=0.06
    )
    tf_n = num_badge.text_frame
    tf_n.margin_left = tf_n.margin_right = tf_n.margin_top = tf_n.margin_bottom = Inches(0)
    tf_n.vertical_anchor = MSO_ANCHOR.MIDDLE
    pn = tf_n.paragraphs[0]
    pn.alignment = PP_ALIGN.CENTER
    rn = pn.add_run()
    rn.text = f"{slide_idx:02d} / {total_slides:02d}"
    rn.font.name = FONT_MONO
    rn.font.size = Pt(9.0)
    rn.font.bold = True
    rn.font.color.rgb = C_INDIGO_LIGHT


def render_title_slide(slide, slide_el: Tag, slide_idx: int, total_slides: int) -> None:
    set_slide_gradient_bg(slide, "07090E", "10172D")

    badge_el = slide_el.select_one(".title-badge")
    h_el = slide_el.select_one(".main-heading")
    sub_el = slide_el.select_one(".sub-heading")
    meta_cols = slide_el.select(".meta-col")

    badge_txt = clean_ws(badge_el.get_text()) if badge_el else ""
    bw = min(9.8, max(5.0, len(badge_txt) * 0.10 + 0.7))
    bx = (SLIDE_W_IN - bw) / 2.0
    pill = add_rect(
        slide, bx, 1.48, bw, 0.36,
        fill=C_TAG_BG, border=C_TAG_BORDER, border_pt=1.0,
        rounded=True, radius_in=0.18
    )
    tf_b = pill.text_frame
    tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = Inches(0)
    tf_b.vertical_anchor = MSO_ANCHOR.MIDDLE
    pb = tf_b.paragraphs[0]
    pb.alignment = PP_ALIGN.CENTER
    rb = pb.add_run()
    rb.text = badge_txt.upper()
    rb.font.name = FONT_UI
    rb.font.size = Pt(9.5)
    rb.font.bold = True
    rb.font.color.rgb = C_INDIGO_LIGHT

    tb_h = add_textbox(slide, 0.85, 2.08, 11.63, 0.95)
    p_h = tb_h.text_frame.paragraphs[0]
    p_h.alignment = PP_ALIGN.CENTER
    p_h.line_spacing = Pt(46)
    if h_el:
        h_chunks: List[Tuple[str, bool]] = []
        for ch in h_el.children:
            if isinstance(ch, NavigableString):
                t = clean_ws(str(ch)).strip()
                if t:
                    h_chunks.append((t, False))
            elif isinstance(ch, Tag):
                t = clean_ws(ch.get_text()).strip()
                if t:
                    h_chunks.append((t, True))
        for idx, (t, is_accent) in enumerate(h_chunks):
            r = p_h.add_run()
            r.text = (" " + t) if idx > 0 else t
            r.font.name = FONT_UI
            r.font.size = Pt(42)
            r.font.bold = True
            r.font.color.rgb = C_INDIGO_SOFT if is_accent else C_WHITE

    sub_txt = clean_ws(sub_el.get_text()) if sub_el else ""
    add_textbox(
        slide, 2.05, 3.12, 9.23, 0.95,
        text=sub_txt, font_size=14.5, color=C_TEXT_MUTED,
        align=PP_ALIGN.CENTER, line_pt=20.0
    )

    cols_data = []
    for mc in meta_cols:
        lbl = mc.select_one(".meta-label")
        val = mc.select_one(".meta-value")
        cols_data.append((
            clean_ws(lbl.get_text()) if lbl else "",
            clean_ws(val.get_text()) if val else "",
        ))

    if cols_data:
        has_long_url = any(len(v) > 35 for _, v in cols_data)
        card_w = 11.2 if has_long_url else 9.0
        card_x = (SLIDE_W_IN - card_w) / 2.0
        card_y = 4.48
        card_h = 1.18
        add_rect(
            slide, card_x, card_y, card_w, card_h,
            fill=RGBColor(0x0E, 0x15, 0x28), border=RGBColor(0x28, 0x35, 0x4E), border_pt=1.0,
            rounded=True, radius_in=0.16
        )
        if has_long_url and len(cols_data) == 3:
            widths = [card_w * 0.27, card_w * 0.22, card_w * 0.51]
        else:
            widths = [card_w / len(cols_data)] * len(cols_data)

        cur_x = card_x + 0.35
        for i, (lbl, val) in enumerate(cols_data):
            cw = widths[i] - (0.35 if i == 0 else 0.25)
            add_textbox(
                slide, cur_x, card_y + 0.22, cw, 0.24,
                text=lbl.upper(), font_size=8.5, color=C_TEXT_DIM, bold=True
            )
            add_textbox(
                slide, cur_x, card_y + 0.48, cw, 0.48,
                text=val, font_size=12.0 if len(val) > 38 else 13.0,
                color=RGBColor(0xF8, 0xFA, 0xFC), bold=True
            )
            if i < len(cols_data) - 1:
                div_x = cur_x + cw + 0.10
                add_rect(slide, div_x, card_y + 0.24, 0.012, card_h - 0.48, fill=RGBColor(0x23, 0x30, 0x48))
                cur_x = div_x + 0.22

    add_footer(slide, "Grand Impérial PMS", slide_idx, total_slides)


def render_table(
    slide,
    table_el: Tag,
    x_in: float,
    y_in: float,
    w_in: float,
    max_h_in: float,
    font_pt: float = 9.5,
    single_layout: bool = False,
) -> float:
    """Рендерит нативную таблицу PPTX без перерыва слов посредине и с аккуратными цветами."""
    rows_els = table_el.select("tr")
    if not rows_els:
        return 0.0
    n_rows = len(rows_els)
    n_cols = max(len(r.find_all(["th", "td"])) for r in rows_els)

    col_scores = [6.0] * n_cols
    max_word_per_col = [1] * n_cols
    for r_el in rows_els:
        cells = r_el.find_all(["th", "td"])
        for ci, c_el in enumerate(cells):
            txt = clean_ws(c_el.get_text())
            col_scores[ci] = max(col_scores[ci], min(len(txt), 48))
            for tok in re.split(r"\s+", txt):
                max_word_per_col[ci] = max(max_word_per_col[ci], len(tok))

    headers = [clean_ws(h.get_text()).lower() for h in rows_els[0].find_all(["th", "td"])]
    if headers == ["метод", "эндпоинт rest api", "контроллер", "назначение операции"]:
        col_ratios = [0.10, 0.29, 0.16, 0.45]
    elif headers == ["модуль системы", "admin", "manager", "reception"]:
        col_ratios = [0.52, 0.16, 0.16, 0.16]
    elif headers == ["логин", "роли в системе", "уровень доступа"]:
        col_ratios = [0.18, 0.46, 0.36]
    elif headers == ["колонка", "тип данных", "ограничения", "описание"]:
        col_ratios = [0.23, 0.21, 0.26, 0.30]
    elif headers == ["поле", "тип", "назначение"]:
        col_ratios = [0.30, 0.21, 0.49]
    elif headers == ["исключение", "http код", "код ошибки"]:
        col_ratios = [0.51, 0.19, 0.30]
    else:
        total_s = sum(col_scores) or 1.0
        col_ratios = [s / total_s for s in col_scores]

    col_widths = [w_in * r for r in col_ratios]

    # Автоподбор шрифта, чтобы ни длинные идентификаторы, ни вся таблица не переполнялись
    f_pt = 10.5 if single_layout else font_pt
    pad_v = 0.20 if single_layout else (0.12 if n_rows <= 6 else (0.09 if n_rows <= 8 else 0.07))

    while f_pt >= 7.8:
        word_overflow = False
        for ci, mw in enumerate(max_word_per_col):
            # Предполагаем моноширинный верхний порог для идентификаторов Java/SQL
            need_w = mw * (f_pt * 0.59 / 72.0) + 0.18
            if mw >= 6 and need_w > col_widths[ci]:
                word_overflow = True
                break

        row_heights = []
        for ri, r_el in enumerate(rows_els):
            cells = r_el.find_all(["th", "td"])
            max_lines = 1
            for ci, c_el in enumerate(cells):
                txt = clean_ws(c_el.get_text())
                is_m = (ci == 0 and ri > 0)
                lines = estimate_text_lines(txt, f_pt, max(col_widths[ci] - 0.16, 0.35), is_mono=is_m)
                max_lines = max(max_lines, lines)
            rh = max(0.28, max_lines * (ui_line_pt(f_pt) / 72.0) + pad_v)
            row_heights.append(rh)

        if sum(row_heights) <= max_h_in and not word_overflow:
            break
        f_pt -= 0.4
        pad_v = max(0.055, pad_v - 0.015)

    total_h = sum(row_heights)
    if total_h > max_h_in:
        scale = max_h_in / total_h
        row_heights = [rh * scale for rh in row_heights]
        total_h = max_h_in

    tbl_shape = slide.shapes.add_table(n_rows, n_cols, Inches(x_in), Inches(y_in), Inches(w_in), Inches(total_h))
    table = tbl_shape.table
    clear_table_default_style(table)

    for ci, cw in enumerate(col_widths):
        table.columns[ci].width = Inches(cw)
    for ri, rh in enumerate(row_heights):
        table.rows[ri].height = Inches(rh)

    for ri, r_el in enumerate(rows_els):
        cells = r_el.find_all(["th", "td"])
        is_header = (ri == 0)
        for ci in range(n_cols):
            cell = table.cell(ri, ci)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_left = Inches(0.08)
            cell.margin_right = Inches(0.08)
            cell.margin_top = Inches(0.03)
            cell.margin_bottom = Inches(0.03)
            set_cell_border(cell, "243044", 6350)

            cell.fill.solid()
            if is_header:
                cell.fill.fore_color.rgb = C_TBL_TH_BG
            else:
                cell.fill.fore_color.rgb = C_TBL_TD_BG1 if ri % 2 == 1 else C_TBL_TD_BG2

            if ci >= len(cells):
                continue
            c_el = cells[ci]
            tf = cell.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.line_spacing = Pt(ui_line_pt(f_pt))

            badge_el = c_el.select_one(".badge")
            pm_el = c_el.select_one(".postman-method")

            if pm_el:
                cls = pm_el.get("class", []) or []
                bg_c, txt_c = C_TBL_TD_BG1, C_WHITE
                for mk, pair in METHOD_CELL_TINTS.items():
                    if mk in cls:
                        bg_c, txt_c = pair
                        break
                cell.fill.fore_color.rgb = bg_c
                p.alignment = PP_ALIGN.CENTER
                r = p.add_run()
                r.text = clean_ws(pm_el.get_text())
                r.font.name = FONT_MONO
                r.font.size = Pt(f_pt)
                r.font.bold = True
                r.font.color.rgb = txt_c
            elif badge_el:
                cls = badge_el.get("class", []) or []
                bg_c, _, txt_c = BADGE_PALETTES["badge-neutral"]
                for bk, triple in BADGE_PALETTES.items():
                    if bk in cls:
                        bg_c, _, txt_c = triple
                        break
                cell.fill.fore_color.rgb = bg_c
                p.alignment = PP_ALIGN.CENTER
                r = p.add_run()
                r.text = clean_ws(badge_el.get_text())
                r.font.name = FONT_MONO
                r.font.size = Pt(f_pt)
                r.font.bold = True
                r.font.color.rgb = txt_c
            else:
                runs = collect_inline_runs(c_el)
                p.alignment = PP_ALIGN.LEFT
                def_col = RGBColor(0xE2, 0xE8, 0xF0) if is_header else C_TEXT_MUTED
                write_runs_to_paragraph(p, runs, f_pt, def_col, base_bold=is_header)

    return total_h


def get_pre_lines(el: Tag) -> List[str]:
    raw = html.unescape(el.get_text())
    lines = raw.splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return lines


def render_code_block(slide, el: Tag, x_in: float, y_in: float, w_in: float, max_h_in: float) -> float:
    lines = get_pre_lines(el)
    if not lines:
        return 0.0
    max_len = max(len(ln) for ln in lines)

    f_pt = 9.5
    if max_len > 70:
        f_pt = 8.0
    elif max_len > 58:
        f_pt = 8.5

    pad_x = 0.16
    pad_y = 0.15
    inner_w = max(w_in - 2 * pad_x, 1.0)
    need_h = max_h_in

    while f_pt >= 6.8:
        char_w_in = (f_pt * 0.605) / 72.0
        chars_cap = int(inner_w / char_w_in)
        wrapped_lines = 0
        for ln in lines:
            wrapped_lines += max(1, math.ceil(max(len(ln), 1) / max(chars_cap, 10)))
        lp = mono_line_pt(f_pt)
        need_h = wrapped_lines * (lp / 72.0) + 2 * pad_y + 0.06
        if need_h <= max_h_in and max_len <= chars_cap:
            break
        if need_h <= max_h_in and f_pt <= 7.4:
            break
        f_pt -= 0.4

    box_h = min(max_h_in, max(0.55, need_h))
    add_rect(
        slide, x_in, y_in, w_in, box_h,
        fill=C_CODE_BG, border=C_CODE_BORDER, border_pt=1.0,
        rounded=True, radius_in=0.10
    )
    tb = slide.shapes.add_textbox(
        Inches(x_in + pad_x), Inches(y_in + pad_y),
        Inches(w_in - 2 * pad_x), Inches(max(0.2, box_h - 2 * pad_y + 0.04))
    )
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0)
    tf.vertical_anchor = MSO_ANCHOR.TOP

    lp = mono_line_pt(f_pt)
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.line_spacing = Pt(lp)
        r = p.add_run()
        r.text = ln if ln else " "
        r.font.name = FONT_MONO
        r.font.size = Pt(f_pt)
        stripped = ln.strip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            r.font.color.rgb = C_TEXT_DIM
        else:
            r.font.color.rgb = C_TEXT_CODE

    return box_h


def render_badge_row(slide, div_el: Tag, x_in: float, y_in: float, w_in: float) -> float:
    badges = [b for b in div_el.children if isinstance(b, Tag) and "badge" in (b.get("class", []) or [])]
    if not badges:
        return 0.0
    cur_x = x_in
    cur_y = y_in
    row_h = 0.25
    gap_x = 0.06
    gap_y = 0.07

    for b in badges:
        txt = clean_ws(b.get_text())
        cls = b.get("class", []) or []
        bg_c, brd_c, txt_c = BADGE_PALETTES["badge-neutral"]
        for bk, triple in BADGE_PALETTES.items():
            if bk in cls:
                bg_c, brd_c, txt_c = triple
                break
        bw = min(w_in, max(0.65, len(txt) * 0.065 + 0.18))
        if cur_x + bw > x_in + w_in + 0.02 and cur_x > x_in:
            cur_x = x_in
            cur_y += row_h + gap_y
        pill = add_rect(
            slide, cur_x, cur_y, bw, row_h,
            fill=bg_c, border=brd_c, border_pt=0.75, rounded=True, radius_in=0.06
        )
        tf = pill.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0)
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = txt
        r.font.name = FONT_MONO
        r.font.size = Pt(7.8)
        r.font.bold = True
        r.font.color.rgb = txt_c
        cur_x += bw + gap_x

    return (cur_y - y_in) + row_h


def render_stat_grid(slide, grid_el: Tag, x_in: float, y_in: float, w_in: float, h_in: float) -> float:
    stats = grid_el.select(".stat-card")
    if not stats:
        return 0.0
    cols = 2
    rows = math.ceil(len(stats) / 2)
    gap = 0.16
    cw = (w_in - gap) / 2.0
    ch = min(1.85, (h_in - gap * (rows - 1)) / rows)
    start_y = y_in + max(0.0, (h_in - (rows * ch + gap * (rows - 1))) / 2.0)

    for i, sc in enumerate(stats):
        r = i // cols
        c = i % cols
        sx = x_in + c * (cw + gap)
        sy = start_y + r * (ch + gap)
        add_rect(
            slide, sx, sy, cw, ch,
            fill=C_PM_CARD_BG, border=RGBColor(0x27, 0x33, 0x4A), border_pt=1.0,
            rounded=True, radius_in=0.12
        )
        val_el = sc.select_one(".stat-value")
        lbl_el = sc.select_one(".stat-label")
        val_txt = clean_ws(val_el.get_text()) if val_el else ""
        lbl_txt = clean_ws(lbl_el.get_text()) if lbl_el else ""
        val_col = parse_css_prop_color(val_el.get("style") if val_el else None, "color") or C_INDIGO_SOFT

        val_pt = 24.0 if len(val_txt) <= 8 else 20.0
        add_textbox(
            slide, sx + 0.10, sy + ch * 0.22, cw - 0.20, ch * 0.40,
            text=val_txt, font_size=val_pt, color=val_col, bold=True,
            font_name=FONT_MONO, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE
        )
        add_textbox(
            slide, sx + 0.10, sy + ch * 0.62, cw - 0.20, ch * 0.30,
            text=lbl_txt.upper(), font_size=8.5, color=C_TEXT_MUTED, bold=True,
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.TOP, line_pt=11.0
        )
    return rows * ch + gap * (rows - 1)


def split_paragraph_chunks(runs: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]) -> List[List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]]:
    paragraphs: List[List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]] = [[]]
    for txt, b, it, cd, col in runs:
        if txt == "\n":
            paragraphs.append([])
        else:
            paragraphs[-1].append((txt, b, it, cd, col))
    return paragraphs


def _trim_para_runs(p_runs: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]) -> List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]:
    cleaned = list(p_runs)
    while cleaned and not cleaned[0][0].strip():
        cleaned.pop(0)
    while cleaned and not cleaned[-1][0].strip():
        cleaned.pop()
    if cleaned:
        t0, b0, i0, c0, col0 = cleaned[0]
        cleaned[0] = (t0.lstrip(), b0, i0, c0, col0)
        tl, bl, il, cl, coll = cleaned[-1]
        cleaned[-1] = (tl.rstrip(), bl, il, cl, coll)
    return cleaned


def measure_inline_height(
    paras: List[List[Tuple[str, bool, bool, bool, Optional[RGBColor]]]],
    w_in: float,
    font_pt: float,
    is_mono: bool = False,
) -> float:
    total_h = 0.0
    lp = mono_line_pt(font_pt) if is_mono else ui_line_pt(font_pt)
    max_em = max((w_in * 72.0) / max(font_pt, 1.0), 6.0)
    for pr in paras:
        trimmed = _trim_para_runs(pr)
        if not trimmed:
            total_h += (lp / 72.0) * 0.55
            continue
        if is_mono:
            joined = "".join(t for t, *_ in trimmed)
            total_h += estimate_block_h(joined, font_pt, w_in, is_mono=True)
            continue

        # Посимвольный подсчет переносов с учетом bold и inline code в каждом run
        tokens: List[Tuple[str, float]] = []
        for txt, b, _it, cd, _col in trimmed:
            parts = re.findall(r"\S+|\s+", txt)
            for part in parts:
                w_em = sum(_char_em_width(ch, is_mono=cd, bold=b) for ch in part)
                tokens.append((part, w_em))

        lines = 1
        cur_em = 0.0
        for part, w_em in tokens:
            if part.isspace():
                if cur_em > 0.0:
                    cur_em += w_em
                continue
            if cur_em == 0.0:
                if w_em <= max_em:
                    cur_em = w_em
                else:
                    extra = max(0, math.ceil(w_em / max_em) - 1)
                    lines += extra
                    cur_em = w_em - extra * max_em
            elif cur_em + w_em <= max_em:
                cur_em += w_em
            else:
                lines += 1
                if w_em <= max_em:
                    cur_em = w_em
                else:
                    extra = max(0, math.ceil(w_em / max_em) - 1)
                    lines += extra
                    cur_em = w_em - extra * max_em
        total_h += lines * (lp / 72.0)
    return total_h


def render_inline_chunks(
    slide,
    runs: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]],
    x_in: float,
    y_in: float,
    w_in: float,
    font_pt: float = 10.5,
    default_color: RGBColor = C_TEXT_MUTED,
) -> float:
    paras = [_trim_para_runs(pr) for pr in split_paragraph_chunks(runs)]
    while paras and not paras[0]:
        paras.pop(0)
    while paras and not paras[-1]:
        paras.pop()
    if not paras:
        return 0.0

    lp = ui_line_pt(font_pt)
    total_h = measure_inline_height(paras, w_in, font_pt) + 0.04

    tb = add_textbox(slide, x_in, y_in, w_in, max(total_h + 0.04, 0.22))
    tf = tb.text_frame
    for idx, p_runs in enumerate(paras):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        if not p_runs:
            p.line_spacing = Pt(round(lp * 0.55, 1))
            r = p.add_run()
            r.text = " "
            r.font.name = FONT_UI
            r.font.size = Pt(font_pt)
        else:
            p.line_spacing = Pt(lp)
            write_runs_to_paragraph(p, p_runs, font_pt, default_color)
    return total_h


def render_styled_subbox(
    slide,
    div_el: Tag,
    x_in: float,
    y_in: float,
    w_in: float,
    font_pt: float = 10.0,
) -> float:
    style = div_el.get("style") or ""
    left_bar_col = None
    border_col = None
    fill_col = RGBColor(0x18, 0x22, 0x36)

    m_bl = re.search(r"border-left\s*:[^;]*?(#[0-9a-fA-F]{6})", style)
    if m_bl:
        left_bar_col = parse_hex_color(m_bl.group(1))
    m_b = re.search(r"(?:^|;)\s*border\s*:[^;]*?(#[0-9a-fA-F]{6}|rgba?\([^)]+\))", style)
    if m_b:
        border_col = parse_hex_color(m_b.group(1))
    m_bg = re.search(r"background\s*:[^;]*?(#[0-9a-fA-F]{6}|rgba?\([^)]+\))", style)
    if m_bg:
        bg_c = parse_hex_color(m_bg.group(1))
        if bg_c:
            if "rgba" in m_bg.group(1) and (bg_c[0] + bg_c[1] + bg_c[2]) > 400:
                fill_col = RGBColor(0x1A, 0x22, 0x35)
            else:
                fill_col = bg_c

    if "rgba(16,185,129" in style.replace(" ", ""):
        fill_col = RGBColor(0x0D, 0x29, 0x24)
        border_col = border_col or RGBColor(0x18, 0x5E, 0x48)
    elif "rgba(99,102,241" in style.replace(" ", ""):
        fill_col = RGBColor(0x18, 0x1D, 0x42)
        border_col = border_col or RGBColor(0x42, 0x47, 0x9E)
    elif "rgba(56,189,248" in style.replace(" ", ""):
        fill_col = RGBColor(0x0E, 0x26, 0x39)
        border_col = border_col or RGBColor(0x27, 0x6E, 0x99)
    elif "rgba(52,211,153" in style.replace(" ", ""):
        fill_col = RGBColor(0x0D, 0x28, 0x22)
        border_col = border_col or RGBColor(0x1A, 0x62, 0x4B)
    elif "rgba(251,191,36" in style.replace(" ", ""):
        fill_col = RGBColor(0x2B, 0x23, 0x10)
        border_col = border_col or RGBColor(0x88, 0x65, 0x17)

    # Строка "badge — описание" (Слайды 15 и 17)
    badge = div_el.select_one(":scope > .badge")
    if badge and len(list(div_el.find_all(recursive=False))) == 1:
        b_txt = clean_ws(badge.get_text())
        rest_runs = []
        for ch in div_el.children:
            if ch is badge:
                continue
            rest_runs.extend(collect_inline_runs(ch))
        rest_txt = "".join(t for t, *_ in rest_runs).strip().lstrip("— ")
        cls = badge.get("class", []) or []
        bg_c, brd_c, txt_c = BADGE_PALETTES["badge-neutral"]
        for bk, triple in BADGE_PALETTES.items():
            if bk in cls:
                bg_c, brd_c, txt_c = triple
                break
        bw = max(1.18, min(1.55, len(b_txt) * 0.08 + 0.22))
        pill = add_rect(
            slide, x_in, y_in + 0.01, bw, 0.25,
            fill=bg_c, border=brd_c, border_pt=0.75, rounded=True, radius_in=0.06
        )
        tf_p = pill.text_frame
        tf_p.word_wrap = False
        tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = Inches(0)
        tf_p.vertical_anchor = MSO_ANCHOR.MIDDLE
        pp = tf_p.paragraphs[0]
        pp.alignment = PP_ALIGN.CENTER
        rp = pp.add_run()
        rp.text = b_txt
        rp.font.name = FONT_MONO
        rp.font.size = Pt(8.0)
        rp.font.bold = True
        rp.font.color.rgb = txt_c

        txt_w = max(w_in - bw - 0.12, 1.0)
        th = estimate_block_h(rest_txt, font_pt, txt_w)
        h = max(0.28, th + 0.04)
        add_textbox(
            slide, x_in + bw + 0.12, y_in, txt_w, h,
            text=rest_txt, font_size=font_pt, color=C_TEXT_MUTED,
            anchor=MSO_ANCHOR.MIDDLE, line_pt=ui_line_pt(font_pt)
        )
        return h

    is_mono_term = "JetBrains Mono" in style
    runs = collect_inline_runs(div_el)
    paras = split_paragraph_chunks(runs)
    while paras and not paras[0]:
        paras.pop(0)
    while paras and not paras[-1]:
        paras.pop()

    has_bg = bool(m_bg)
    pad_x = 0.18 if left_bar_col else 0.16
    pad_y = 0.13 if (has_bg or border_col) else 0.04
    inner_w = w_in - pad_x - 0.14 - (0.06 if left_bar_col else 0.0)
    f_box = max(font_pt - 0.5, 9.0) if is_mono_term else font_pt
    lp = mono_line_pt(f_box) if is_mono_term else ui_line_pt(f_box)

    text_h = measure_inline_height(paras, inner_w, f_box, is_mono=is_mono_term)
    box_h = max(0.42, text_h + 2 * pad_y + 0.04)

    # Для блоков с левой цветной полоской используем прямоугольник (без вылезающих углов)
    if left_bar_col:
        if has_bg or border_col:
            add_rect(
                slide, x_in, y_in, w_in, box_h,
                fill=fill_col if has_bg else C_CARD_BG,
                border=border_col, border_pt=0.9, rounded=False
            )
        add_rect(slide, x_in, y_in, 0.05, box_h, fill=left_bar_col)
    elif has_bg or border_col:
        add_rect(
            slide, x_in, y_in, w_in, box_h,
            fill=fill_col if has_bg else C_CARD_BG,
            border=border_col, border_pt=0.95, rounded=True, radius_in=0.10
        )

    tx = x_in + (0.16 if left_bar_col else pad_x)
    tw = w_in - (0.16 if left_bar_col else pad_x) - 0.12
    tb = add_textbox(slide, tx, y_in + pad_y, tw, max(box_h - pad_y + 0.05, 0.25))
    tf = tb.text_frame

    css_text_col = parse_css_prop_color(style, "color")
    if is_mono_term:
        def_c = css_text_col or C_TEXT_CODE
    else:
        def_c = css_text_col or C_TEXT_MUTED

    for idx, pr in enumerate(paras):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.line_spacing = Pt(lp)
        write_runs_to_paragraph(
            p, pr, f_box,
            default_color=def_c,
            font_override=FONT_MONO if is_mono_term else None,
        )
    return box_h


def render_list(slide, list_el: Tag, x_in: float, y_in: float, w_in: float, font_pt: float = 10.5) -> float:
    is_ordered = (list_el.name.lower() == "ol")
    items = [li for li in list_el.children if isinstance(li, Tag) and li.name.lower() == "li"]
    cur_y = y_in
    gap = 0.08

    for idx, li in enumerate(items, 1):
        nested_badge_div = li.find("div")
        spans = [ch for ch in li.children if isinstance(ch, Tag) and ch.name.lower() == "span"]
        if len(spans) == 2 and re.match(r"^\[\d+\]$", clean_ws(spans[0].get_text())):
            marker_txt = clean_ws(spans[0].get_text())
            marker_col = parse_css_prop_color(spans[0].get("style"), "color") or C_CYAN
            body_runs = collect_inline_runs(spans[1])
            mw = 0.42
            add_textbox(
                slide, x_in, cur_y, mw, 0.24,
                text=marker_txt, font_size=font_pt, color=marker_col, bold=True,
                font_name=FONT_MONO, line_pt=ui_line_pt(font_pt)
            )
            bh = render_inline_chunks(slide, body_runs, x_in + mw, cur_y, w_in - mw, font_pt=font_pt, default_color=C_TEXT_MUTED)
            cur_y += max(bh, 0.24) + gap
            continue

        marker = f"{idx}." if is_ordered else "•"
        marker_col = C_CYAN if is_ordered else C_INDIGO_SOFT
        mw = 0.25 if is_ordered else 0.18
        add_textbox(
            slide, x_in, cur_y, mw, 0.24,
            text=marker, font_size=font_pt, color=marker_col, bold=True,
            line_pt=ui_line_pt(font_pt)
        )

        if nested_badge_div and nested_badge_div.select(".badge"):
            before_runs: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]] = []
            for ch in li.children:
                if ch is nested_badge_div:
                    continue
                before_runs.extend(collect_inline_runs(ch))
            th = render_inline_chunks(slide, before_runs, x_in + mw, cur_y, w_in - mw, font_pt=font_pt, default_color=C_TEXT_MUTED)
            cur_y += th + 0.05
            bh = render_badge_row(slide, nested_badge_div, x_in + mw, cur_y, w_in - mw)
            cur_y += bh + gap
        else:
            li_runs = collect_inline_runs(li)
            th = render_inline_chunks(slide, li_runs, x_in + mw, cur_y, w_in - mw, font_pt=font_pt, default_color=C_TEXT_MUTED)
            cur_y += max(th, 0.22) + gap

    return max(0.0, cur_y - y_in - gap)


def render_flow_nodes(
    slide,
    nodes: List,
    x_in: float,
    y_in: float,
    w_in: float,
    max_h_in: float,
    font_pt: float = 10.5,
    single_layout: bool = False,
) -> float:
    cur_y = y_in
    inline_buf: List[Tuple[str, bool, bool, bool, Optional[RGBColor]]] = []
    block_gap = 0.12

    def flush_inline() -> None:
        nonlocal cur_y, inline_buf
        if not inline_buf:
            return
        if any(t.strip() for t, *_ in inline_buf):
            h = render_inline_chunks(slide, inline_buf, x_in, cur_y, w_in, font_pt=font_pt, default_color=C_TEXT_MUTED)
            if h > 0:
                cur_y += h + block_gap * 0.8
        inline_buf = []

    for node in nodes:
        if isinstance(node, NavigableString):
            raw = html.unescape(str(node)).replace("\xa0", " ")
            txt = re.sub(r"[ \t\r\n]+", " ", raw)
            if txt.strip():
                inline_buf.append((txt, False, False, False, None))
            elif txt == " " and inline_buf and not inline_buf[-1][0].endswith((" ", "\n")):
                # Сохраняем одиночный пробел между смежными тегами (например <strong>...</strong> <code>...</code>)
                inline_buf.append((" ", False, False, False, None))
            continue
        if not isinstance(node, Tag):
            continue

        tag_name = node.name.lower()
        classes = node.get("class", []) or []

        if tag_name in ("br", "strong", "b", "em", "i", "code", "span") and "badge" not in classes:
            inline_buf.extend(collect_inline_runs(node))
            continue

        flush_inline()
        rem_h = max(0.4, (y_in + max_h_in) - cur_y)

        if "code-block" in classes:
            cur_y += 0.08
            rem_h = max(0.4, (y_in + max_h_in) - cur_y)
            h = render_code_block(slide, node, x_in, cur_y, w_in, rem_h)
            cur_y += h + block_gap
        elif "pres-table" in classes or tag_name == "table":
            h = render_table(
                slide, node, x_in, cur_y, w_in, rem_h,
                font_pt=max(font_pt - 0.9, 8.8), single_layout=single_layout
            )
            cur_y += h + block_gap
        elif tag_name in ("ul", "ol"):
            h = render_list(slide, node, x_in, cur_y, w_in, font_pt=font_pt)
            cur_y += h + block_gap
        elif "grid-2" in classes and node.select(".stat-card"):
            h = render_stat_grid(slide, node, x_in, cur_y, w_in, rem_h)
            cur_y += h + block_gap
        elif tag_name == "div":
            style = node.get("style") or ""
            child_divs = [c for c in node.children if isinstance(c, Tag) and c.name.lower() == "div"]
            direct_badges = [c for c in node.children if isinstance(c, Tag) and "badge" in (c.get("class", []) or [])]

            if direct_badges and not child_divs:
                h = render_badge_row(slide, node, x_in, cur_y, w_in)
                cur_y += h + block_gap
            elif "flex-direction:column" in style.replace(" ", "") and child_divs:
                for sub_d in child_divs:
                    sub_h = render_styled_subbox(slide, sub_d, x_in, cur_y, w_in, font_pt=max(font_pt - 0.3, 9.4))
                    cur_y += sub_h + 0.09
                cur_y += 0.03
            elif any(k in style for k in ("border", "background", "JetBrains Mono")) or parse_css_prop_color(style, "color"):
                if any(k in style for k in ("border", "background")):
                    h = render_styled_subbox(slide, node, x_in, cur_y, w_in, font_pt=max(font_pt - 0.3, 9.4))
                    cur_y += h + block_gap
                else:
                    col = parse_css_prop_color(style, "color") or C_TEXT_MUTED
                    runs = collect_inline_runs(node, color=col)
                    h = render_inline_chunks(slide, runs, x_in, cur_y, w_in, font_pt=max(font_pt - 0.3, 9.8), default_color=col)
                    cur_y += h + block_gap
            else:
                h_used = render_flow_nodes(slide, list(node.children), x_in, cur_y, w_in, rem_h, font_pt=font_pt, single_layout=single_layout)
                cur_y += h_used
        else:
            runs = collect_inline_runs(node)
            h = render_inline_chunks(slide, runs, x_in, cur_y, w_in, font_pt=font_pt)
            cur_y += h + block_gap

    flush_inline()
    return max(0.0, cur_y - y_in)


def render_card(
    slide,
    card_el: Tag,
    x_in: float,
    y_in: float,
    w_in: float,
    h_in: float,
    layout_mode: str = "grid-2",
) -> None:
    classes = card_el.get("class", []) or []
    is_hi = "highlight" in classes
    add_rect(
        slide, x_in, y_in, w_in, h_in,
        fill=C_CARD_HI_BG if is_hi else C_CARD_BG,
        border=C_CARD_HI_BORDER if is_hi else C_CARD_BORDER,
        border_pt=1.0, rounded=True, radius_in=0.15
    )

    pad_x = 0.28 if layout_mode in ("grid-2", "single") else (0.24 if layout_mode == "grid-3" else 0.20)
    pad_y = 0.24 if layout_mode in ("grid-2", "single") else (0.22 if layout_mode == "grid-3" else 0.18)
    inner_x = x_in + pad_x
    inner_w = w_in - 2 * pad_x
    cur_y = y_in + pad_y

    icon_el = card_el.select_one(":scope > .card-icon")
    title_el = card_el.select_one(":scope > .card-title")

    icon_txt = clean_ws(icon_el.get_text()) if icon_el else ""
    title_txt = clean_ws(title_el.get_text()) if title_el else ""
    title_col = parse_css_prop_color(title_el.get("style") if title_el else None, "color") or C_WHITE

    if icon_el and title_el:
        if layout_mode == "grid-2":
            ico_sz = 0.42
            ico_box = add_rect(
                slide, inner_x, cur_y, ico_sz, ico_sz,
                fill=C_TAG_BG, border=C_TAG_BORDER, border_pt=0.85, rounded=True, radius_in=0.09
            )
            tf_i = ico_box.text_frame
            tf_i.margin_left = tf_i.margin_right = tf_i.margin_top = tf_i.margin_bottom = Inches(0)
            tf_i.vertical_anchor = MSO_ANCHOR.MIDDLE
            pi = tf_i.paragraphs[0]
            pi.alignment = PP_ALIGN.CENTER
            ri = pi.add_run()
            ri.text = icon_txt
            ri.font.name = FONT_EMOJI
            ri.font.size = Pt(14.5)
            ri.font.color.rgb = C_INDIGO_LIGHT

            tx = inner_x + ico_sz + 0.14
            tw = inner_w - ico_sz - 0.14
            t_pt = 13.5 if len(title_txt) <= 44 else 12.5
            th_est = estimate_block_h(title_txt, t_pt, tw, bold=True)
            th = max(ico_sz, th_est)
            add_textbox(
                slide, tx, cur_y, tw, th,
                text=title_txt, font_size=t_pt, color=title_col, bold=True,
                anchor=MSO_ANCHOR.MIDDLE, line_pt=ui_line_pt(t_pt)
            )
            cur_y += th + 0.15
        else:
            ico_sz = 0.40 if layout_mode == "grid-3" else 0.36
            ico_box = add_rect(
                slide, inner_x, cur_y, ico_sz, ico_sz,
                fill=C_TAG_BG, border=C_TAG_BORDER, border_pt=0.85, rounded=True, radius_in=0.09
            )
            tf_i = ico_box.text_frame
            tf_i.margin_left = tf_i.margin_right = tf_i.margin_top = tf_i.margin_bottom = Inches(0)
            tf_i.vertical_anchor = MSO_ANCHOR.MIDDLE
            pi = tf_i.paragraphs[0]
            pi.alignment = PP_ALIGN.CENTER
            ri = pi.add_run()
            ri.text = icon_txt
            ri.font.name = FONT_EMOJI
            ri.font.size = Pt(13.5)
            ri.font.color.rgb = C_INDIGO_LIGHT
            cur_y += ico_sz + 0.13

            t_pt = 13.2 if layout_mode == "grid-3" else 12.0
            th = estimate_block_h(title_txt, t_pt, inner_w, bold=True)
            add_textbox(
                slide, inner_x, cur_y, inner_w, th + 0.03,
                text=title_txt, font_size=t_pt, color=title_col, bold=True, line_pt=ui_line_pt(t_pt)
            )
            cur_y += th + 0.11
    elif title_el:
        t_pt = 13.8 if layout_mode == "grid-2" else 13.2
        th = estimate_block_h(title_txt, t_pt, inner_w, bold=True)
        add_textbox(
            slide, inner_x, cur_y, inner_w, th + 0.03,
            text=title_txt, font_size=t_pt, color=title_col, bold=True, line_pt=ui_line_pt(t_pt)
        )
        cur_y += th + 0.15

    body_nodes = [
        ch for ch in card_el.children
        if not (isinstance(ch, Tag) and (
            "card-icon" in (ch.get("class", []) or []) or "card-title" in (ch.get("class", []) or [])
        ))
    ]
    expanded_nodes = []
    for n in body_nodes:
        if isinstance(n, Tag) and "card-text" in (n.get("class", []) or []):
            expanded_nodes.extend(list(n.children))
        else:
            expanded_nodes.append(n)

    base_font = 10.6 if layout_mode in ("grid-2", "single") else (10.5 if layout_mode == "grid-3" else 9.6)
    rem_h = max(0.5, (y_in + h_in - pad_y) - cur_y)
    render_flow_nodes(
        slide, expanded_nodes, inner_x, cur_y, inner_w, rem_h,
        font_pt=base_font, single_layout=(layout_mode == "single")
    )


def render_postman_card(slide, pm_el: Tag, x_in: float, y_in: float, w_in: float, h_in: float) -> None:
    add_rect(
        slide, x_in, y_in, w_in, h_in,
        fill=C_PM_CARD_BG, border=C_PM_CARD_BORDER, border_pt=1.0,
        rounded=True, radius_in=0.14
    )

    topbar_x = x_in + 0.10
    topbar_y = y_in + 0.10
    topbar_w = w_in - 0.20
    topbar_h = 0.42
    # Внутренняя скругленная планка без нахлеста квадратных углов на рамку карточки
    add_rect(
        slide, topbar_x, topbar_y, topbar_w, topbar_h,
        fill=C_PM_TOPBAR_BG, border=C_PM_CARD_BORDER, border_pt=0.75,
        rounded=True, radius_in=0.08
    )

    method_el = pm_el.select_one(".postman-method")
    url_el = pm_el.select_one(".postman-url")
    status_el = pm_el.select_one(".postman-status")
    body_el = pm_el.select_one(".postman-body")

    method_txt = clean_ws(method_el.get_text()) if method_el else "GET"
    m_cls = method_el.get("class", []) or [] if method_el else []
    m_col = METHOD_COLORS["method-get"]
    for mk, mc in METHOD_COLORS.items():
        if mk in m_cls:
            m_col = mc
            break

    mw = max(0.60, len(method_txt) * 0.09 + 0.20)
    mpill = add_rect(
        slide, topbar_x + 0.10, topbar_y + 0.085, mw, 0.25,
        fill=m_col, rounded=True, radius_in=0.05
    )
    tf_m = mpill.text_frame
    tf_m.margin_left = tf_m.margin_right = tf_m.margin_top = tf_m.margin_bottom = Inches(0)
    tf_m.vertical_anchor = MSO_ANCHOR.MIDDLE
    pm = tf_m.paragraphs[0]
    pm.alignment = PP_ALIGN.CENTER
    rm = pm.add_run()
    rm.text = method_txt
    rm.font.name = FONT_MONO
    rm.font.size = Pt(8.5)
    rm.font.bold = True
    rm.font.color.rgb = C_WHITE

    status_txt = clean_ws(status_el.get_text()) if status_el else ""
    status_col = parse_css_prop_color(status_el.get("style") if status_el else None, "color") or RGBColor(0x4A, 0xDE, 0x80)
    sw = min(1.80, max(1.12, len(status_txt) * 0.072 + 0.10))
    sx = topbar_x + topbar_w - sw - 0.10

    url_txt = clean_ws(url_el.get_text()) if url_el else ""
    ux = topbar_x + 0.10 + mw + 0.10
    uw = max(1.2, sx - ux - 0.08)
    url_pt = 8.0 if len(url_txt) > 35 else 8.8
    add_textbox(
        slide, ux, topbar_y, uw, topbar_h,
        text=url_txt, font_size=url_pt, color=RGBColor(0xCB, 0xD5, 0xE1),
        font_name=FONT_MONO, anchor=MSO_ANCHOR.MIDDLE
    )
    add_textbox(
        slide, sx, topbar_y, sw, topbar_h,
        text=status_txt, font_size=8.5, color=status_col, bold=True,
        font_name=FONT_MONO, align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE
    )

    bx = x_in + 0.10
    by = topbar_y + topbar_h + 0.08
    bw = w_in - 0.20
    bh = (y_in + h_in - 0.10) - by
    add_rect(
        slide, bx, by, bw, bh,
        fill=C_PM_BODY_BG, border=RGBColor(0x1E, 0x29, 0x3B), border_pt=0.75,
        rounded=True, radius_in=0.08
    )

    lines = get_pre_lines(body_el) if body_el else []
    if lines:
        n_lines = len(lines)
        max_len = max(len(ln) for ln in lines)
        f_pt = 10.0 if n_lines <= 16 else (9.5 if n_lines <= 20 else 9.0)
        if max_len > 62:
            f_pt = min(f_pt, 8.8)
        pad_x, pad_y = 0.16, 0.14
        tb = slide.shapes.add_textbox(
            Inches(bx + pad_x), Inches(by + pad_y),
            Inches(bw - 2 * pad_x), Inches(max(0.4, bh - 2 * pad_y))
        )
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0)
        tf.vertical_anchor = MSO_ANCHOR.TOP

        lp = mono_line_pt(f_pt)
        for i, ln in enumerate(lines):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.alignment = PP_ALIGN.LEFT
            p.line_spacing = Pt(lp)
            r = p.add_run()
            r.text = ln if ln else " "
            r.font.name = FONT_MONO
            r.font.size = Pt(f_pt)
            if ln.strip().startswith("//"):
                r.font.color.rgb = C_TEXT_DIM
            else:
                r.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)


def render_content_slide(slide, slide_el: Tag, slide_idx: int, total_slides: int) -> None:
    set_slide_gradient_bg(slide, "090D16", "0E1426")
    footer_el = slide_el.select_one(".slide-footer .footer-project")
    footer_txt = clean_ws(footer_el.get_text()) if footer_el else "Grand Impérial Hotel PMS"
    add_header_footer(slide, slide_el, slide_idx, total_slides, footer_txt)

    body_el = slide_el.select_one(".slide-body")
    if not body_el:
        return

    BODY_X = 0.55
    BODY_Y = 1.38
    BODY_W = 12.233
    BODY_H = 5.42

    direct = [c for c in body_el.children if isinstance(c, Tag)]
    if not direct:
        return
    container = direct[0]
    cls = container.get("class", []) or []

    if "grid-2" in cls:
        items = [c for c in container.children if isinstance(c, Tag)]
        gap = 0.333
        cw = (BODY_W - gap) / 2.0
        for i, item in enumerate(items[:2]):
            ix = BODY_X + i * (cw + gap)
            item_cls = item.get("class", []) or []
            if "postman-card" in item_cls:
                render_postman_card(slide, item, ix, BODY_Y, cw, BODY_H)
            else:
                render_card(slide, item, ix, BODY_Y, cw, BODY_H, layout_mode="grid-2")

    elif "grid-3" in cls:
        items = [c for c in container.children if isinstance(c, Tag)]
        gap_x = 0.24
        cw = (BODY_W - 2 * gap_x) / 3.0
        if len(items) <= 3:
            ch = 3.15
            cy = BODY_Y + (BODY_H - ch) / 2.0
            for i, item in enumerate(items):
                render_card(slide, item, BODY_X + i * (cw + gap_x), cy, cw, ch, layout_mode="grid-3")
        else:
            gap_y = 0.24
            ch = (BODY_H - gap_y) / 2.0
            for i, item in enumerate(items):
                r, c = i // 3, i % 3
                render_card(slide, item, BODY_X + c * (cw + gap_x), BODY_Y + r * (ch + gap_y), cw, ch, layout_mode="grid-3")

    elif "grid-4" in cls:
        items = [c for c in container.children if isinstance(c, Tag)]
        gap_x = 0.20
        gap_y = 0.22
        cw = (BODY_W - 3 * gap_x) / 4.0
        ch = (BODY_H - gap_y) / 2.0
        for i, item in enumerate(items):
            r, c = i // 4, i % 4
            render_card(slide, item, BODY_X + c * (cw + gap_x), BODY_Y + r * (ch + gap_y), cw, ch, layout_mode="grid-4")

    elif "card" in cls:
        render_card(slide, container, BODY_X, BODY_Y, BODY_W, BODY_H, layout_mode="single")


def convert() -> None:
    if not HTML_PATH.exists():
        raise FileNotFoundError(f"Не найден файл HTML: {HTML_PATH}")

    html_content = HTML_PATH.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_content, "lxml")
    slides_els = soup.select("body > .slide")
    total_slides = len(slides_els)
    if total_slides == 0:
        raise RuntimeError("В HTML-файле не найдены элементы .slide")

    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W_IN)
    prs.slide_height = Inches(SLIDE_H_IN)
    blank_layout = prs.slide_layouts[6]

    for idx, s_el in enumerate(slides_els, 1):
        slide = prs.slides.add_slide(blank_layout)
        if "title-slide" in (s_el.get("class", []) or []):
            render_title_slide(slide, s_el, idx, total_slides)
        else:
            render_content_slide(slide, s_el, idx, total_slides)

    prs.save(str(PPTX_PATH))
    size_kb = PPTX_PATH.stat().st_size / 1024.0
    print(f"Created PPTX: {PPTX_PATH} ({total_slides} slides, {size_kb:.1f} KB)")


if __name__ == "__main__":
    convert()
