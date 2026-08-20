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


def export_pdf(
    scored: list[ScoredFinding],
    output_path: str | Path,
    reveal: bool = False,
    scan_stats: dict | None = None,
) -> None:
    try:
        from weasyprint import HTML
    except ImportError as e:
        raise RuntimeError(
            "PDF export requires WeasyPrint. Install with: pip install weasyprint "
            "(also requires system libs: pango, cairo, gdk-pixbuf — see WeasyPrint docs "
            "for your OS if the pip install alone doesn't work)."
        ) from e

    mode = "static_revealed" if reveal else "static_redacted"
    html = _build_html(scored, mode=mode, scan_stats=scan_stats)
    HTML(string=html).write_pdf(str(output_path))
