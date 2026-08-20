"""
PDF export.

Renders the same case-file HTML design to PDF via WeasyPrint rather than
rebuilding the layout from scratch in a PDF-drawing API — this keeps the
HTML and PDF reports visually identical (same fonts, grid, stamps) with
one source of truth for the design.

The interactive HTML report's click-to-reveal secret disclosure has no
equivalent in a static PDF, so this module makes that decision explicit
rather than silently doing something dangerous or broken:

  - default: secrets are permanently redacted in the PDF, since a PDF is
    a shareable/archivable/printable artifact and a leak report that
    itself leaks the leaks defeats the point.
  - reveal=True: secrets are shown in full, for the person's own local
    remediation use. This is opt-in only (--reveal-in-pdf on the CLI)
    and the PDF carries a visible "do not distribute" notice when used.
"""

from __future__ import annotations

from pathlib import Path

from opsec_scanner.output.dashboard import _build_html
from opsec_scanner.scoring.risk_engine import ScoredFinding


def _render_pdf_fallback(
    scored: list[ScoredFinding],
    output_path: str | Path,
    reveal: bool = False,
    scan_stats: dict | None = None,
) -> None:
    """Built-in pure-Python fallback PDF generator using PyMuPDF (fitz) when WeasyPrint system C-libs are absent."""
    import pymupdf as fitz

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    margin_x = 40
    y = 50
    line_height = 14

    def check_page_break(needed_height: int = 60):
        nonlocal page, y
        if y + needed_height > 780:
            page = doc.new_page(width=595, height=842)
            y = 50

    # Header
    page.insert_text((margin_x, y), "OPSEC SELF-AUDIT REPORT", fontsize=16)
    y += 20

    if reveal:
        page.insert_text(
            (margin_x, y),
            "[!] CONFIDENTIAL — CONTAINS REVEALED SECRETS — DO NOT DISTRIBUTE",
            fontsize=10,
            color=(0.8, 0.1, 0.1),
        )
        y += 18
    else:
        page.insert_text(
            (margin_x, y),
            "[i] Redacted Report — Secrets masked with redaction bars",
            fontsize=9,
            color=(0.4, 0.4, 0.4),
        )
        y += 18

    # Divider
    page.draw_line((margin_x, y), (555, y), color=(0.7, 0.7, 0.7), width=1)
    y += 15

    if not scored:
        page.insert_text((margin_x, y), "STATUS: RECORD CLEAN", fontsize=14, color=(0.1, 0.6, 0.2))
        y += 20
        page.insert_text((margin_x, y), "No OPSEC leaks or identity exposure detected in scanned targets.", fontsize=10)
        doc.save(str(output_path))
        return

    # Stats summary
    summary_text = f"Total Unique Findings: {len(scored)}"
    if scan_stats:
        summary_text += f" | Targets: {scan_stats.get('total_targets', 1)}"
    page.insert_text((margin_x, y), summary_text, fontsize=10, color=(0.3, 0.3, 0.3))
    y += 20

    # Findings
    for idx, f in enumerate(scored, 1):
        check_page_break(80)

        # Finding header
        risk_color = (0.8, 0.1, 0.1) if f.risk_label == "CRITICAL" else (0.9, 0.5, 0.1) if f.risk_label == "HIGH" else (0.3, 0.3, 0.3)
        page.insert_text((margin_x, y), f"#{idx} [{f.risk_label} - Score: {f.risk_score}] {f.match.rule_id}", fontsize=11, color=risk_color)
        y += line_height + 2

        # Display text (redacted vs revealed)
        if reveal:
            display_val = f.match.matched_text
        else:
            val = f.match.matched_text
            display_val = f"████████ [REDACTED: {val[:4]}...{val[-2:] if len(val) > 6 else ''}]"

        page.insert_text((margin_x + 10, y), f"Value: {display_val}", fontsize=9)
        y += line_height

        origin_text = f"Origin: {f.match.finding.origin} ({f.match.finding.context})"
        if len(origin_text) > 80:
            origin_text = origin_text[:77] + "..."
        page.insert_text((margin_x + 10, y), origin_text, fontsize=9, color=(0.4, 0.4, 0.4))
        y += line_height

        if f.identity_reason:
            id_text = f"Identity Correlation: {f.identity_reason}"
            if len(id_text) > 80:
                id_text = id_text[:77] + "..."
            page.insert_text((margin_x + 10, y), id_text, fontsize=8, color=(0.5, 0.3, 0.1))
            y += line_height

        y += 8  # gap between findings

    doc.save(str(output_path))


def export_pdf(
    scored: list[ScoredFinding],
    output_path: str | Path,
    reveal: bool = False,
    scan_stats: dict | None = None,
) -> None:
    try:
        from weasyprint import HTML
        mode = "static_revealed" if reveal else "static_redacted"
        html = _build_html(scored, mode=mode, scan_stats=scan_stats)
        HTML(string=html).write_pdf(str(output_path))
    except (ImportError, OSError):
        # WeasyPrint or its native C-libraries (Pango/Cairo/GObject) not available; use PyMuPDF fallback
        _render_pdf_fallback(scored, output_path, reveal=reveal, scan_stats=scan_stats)
