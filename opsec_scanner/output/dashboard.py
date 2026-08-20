"""
HTML report renderer.

Design concept: a chain-of-custody case file rather than a generic dark
dashboard. Findings are numbered evidence entries (numbering is
meaningful here — the list is genuinely rank-ordered by risk), severity
is shown as a muted ink-stamp badge, and matched secret values render
redacted by default behind a native <details> disclosure in the
interactive HTML version.

A static PDF can't have a click-to-reveal toggle, so pdf_export.py calls
_build_html(mode=...) directly with either "static_redacted" (safe to
share/archive/print — the default) or "static_revealed" (for your own
local remediation use, explicitly opted into via a CLI flag).
"""

from __future__ import annotations

import hashlib
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from opsec_scanner.scoring.risk_engine import ScoredFinding

_STAMP_COLORS = {
    "CRITICAL": "#c0433f",
    "HIGH": "#c07f3f",
    "MEDIUM": "#b8a13f",
    "LOW": "#3f8f6e",
}

_CATEGORY_LABELS = {
    "credentials": "Credentials & Keys",
    "infrastructure": "Infrastructure Exposure",
    "personal": "Personal Identity",
    "system": "System Footprint",
}


def _esc(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _redact(text: str) -> str:
    """Fixed-width redaction bar, independent of the real value's length
    so the bar itself doesn't leak a length signal."""
    return "█" * 18


def _case_id(scored: list[ScoredFinding], generated_at: str) -> str:
    seed = generated_at + "".join(s.match.matched_text for s in scored)
    return hashlib.sha1(seed.encode()).hexdigest()[:8].upper()


def _entry_html(index: int, s: ScoredFinding, mode: str) -> str:
    """
    mode:
      "interactive"     — HTML report, native <details> click-to-reveal.
      "static_redacted" — PDF export, value permanently redacted. Default
                           for PDF since it's a shareable/archivable/
                           printable artifact with no interaction possible.
      "static_revealed" — PDF export, value shown directly. Opt-in only,
                           for personal remediation use — not for sharing.
    """
    color = _STAMP_COLORS.get(s.risk_label, "#6b7280")
    category_label = _CATEGORY_LABELS.get(s.match.category, s.match.category.title())
    occurrence = s.match.finding.metadata.get("occurrence_count", 1)
    occurrence_note = f" · observed {occurrence}×" if occurrence > 1 else ""

    origin = _esc(s.match.finding.origin)
    context = _esc(s.match.finding.context)
    matched_escaped = _esc(s.match.matched_text)
    redacted = _redact(s.match.matched_text)
    reason = _esc(s.identity_reason)

    if mode == "interactive":
        evidence_html = f"""
        <details class="evidence">
          <summary>
            <code class="redacted-value">{redacted}</code>
            <span class="reveal-label">reveal</span>
          </summary>
          <code class="revealed-value">{matched_escaped}</code>
        </details>
        """
    elif mode == "static_redacted":
        evidence_html = f"""
        <div class="evidence evidence-static">
          <code class="redacted-value">{redacted}</code>
          <span class="reveal-label">redacted for distribution</span>
        </div>
        """
    else:  # static_revealed
        evidence_html = f"""
        <div class="evidence evidence-static">
          <code class="revealed-value revealed-value-static">{matched_escaped}</code>
        </div>
        """

    entropy_row = (
        f'<div class="field"><span class="field-label">Entropy</span><span class="field-value">{s.match.entropy_score:.2f} bits/char</span></div>'
        if s.match.entropy_score is not None
        else ""
    )

    return f"""
    <article class="entry" id="entry-{index:03d}">
      <div class="entry-number">{index:03d}</div>
      <div class="entry-body">
        <div class="entry-head">
          <span class="stamp" style="--stamp-color:{color}">{s.risk_label}</span>
          <span class="entry-score">RISK {s.risk_score:.2f}</span>
          <span class="entry-category">{category_label}</span>
          <span class="entry-rule">{_esc(s.match.rule_id)}</span>
        </div>

        {evidence_html}

        <div class="entry-fields">
          <div class="field"><span class="field-label">Origin</span><span class="field-value">{origin}</span></div>
          <div class="field"><span class="field-label">Context</span><span class="field-value">{context}{occurrence_note}</span></div>
          <div class="field"><span class="field-label">Identity confidence</span><span class="field-value">×{s.identity_confidence}</span></div>
          <div class="field"><span class="field-label">Exposure</span><span class="field-value">{s.exposure_level.value.replace('_', ' ')}</span></div>
          {entropy_row}
        </div>

        <p class="entry-note">{reason}</p>
      </div>
    </article>
    """


def _category_bars(scored: list[ScoredFinding]) -> str:
    counts = Counter(s.match.category for s in scored)
    if not counts:
        return '<div class="docket-empty">No categories to report.</div>'
    total = sum(counts.values())
    rows = []
    for category, count in sorted(counts.items(), key=lambda kv: kv[1], reverse=True):
        pct = (count / total) * 100
        label = _CATEGORY_LABELS.get(category, category.title())
        rows.append(f"""
        <div class="bar-row">
          <span class="bar-label">{_esc(label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:{pct:.1f}%"></div></div>
          <span class="bar-count">{count}</span>
        </div>
        """)
    return "".join(rows)


def _scan_scope_html(scan_stats: dict | None) -> str:
    if not scan_stats:
        return ""
    parts = []
    if "commits_scanned" in scan_stats:
        parts.append(f"{scan_stats['commits_scanned']} commits")
    if scan_stats.get("dangling_commits_found"):
        parts.append(f"{scan_stats['dangling_commits_found']} dangling commits recovered")
    if "media_files_scanned" in scan_stats:
        parts.append(f"{scan_stats['media_files_scanned']} media files")
    if "scan_mode" in scan_stats:
        parts.append(f"mode: {scan_stats['scan_mode']}")
    if not parts:
        return ""
    return f'<div class="scope-note">Scan scope: {" · ".join(_esc(p) for p in parts)}</div>'


def _build_html(scored: list[ScoredFinding], mode: str = "interactive", scan_stats: dict | None = None) -> str:
    """Pure function: builds the full HTML document as a string. Does not
    touch the filesystem — render_dashboard() and pdf_export.py both call
    this and handle their own output (write to disk / hand to WeasyPrint)."""
    generated_dt = datetime.now(timezone.utc)
    generated_at = generated_dt.strftime("%Y-%m-%d %H:%M UTC")
    case_id = _case_id(scored, generated_at)

    label_counts = Counter(s.risk_label for s in scored)
    stamp_tallies = "".join(
        f'<div class="tally"><div class="tally-stamp" style="--stamp-color:{_STAMP_COLORS[label]}">{label}</div>'
        f'<div class="tally-count">{label_counts.get(label, 0):02d}</div></div>'
        for label in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    )

    entries_html = (
        "".join(_entry_html(i + 1, s, mode=mode) for i, s in enumerate(scored))
        if scored
        else '<div class="clean-record">RECORD CLEAN — no findings survived detection, correlation, and deduplication.</div>'
    )

    category_html = _category_bars(scored)

    scope_html = _scan_scope_html(scan_stats)

    distribution_notice = ""
    if mode == "static_redacted":
        distribution_notice = '<div class="distribution-notice">Distribution copy — evidence values redacted. Regenerate with the reveal flag for a personal-use copy.</div>'
    elif mode == "static_revealed":
        distribution_notice = '<div class="distribution-notice distribution-notice-warn">Personal-use export — evidence values are shown in full. Do not distribute this file.</div>'

    interactive_notice = (
        'Values behind "reveal" are shown only in this local file — nothing here is transmitted anywhere.'
        if mode == "interactive"
        else "This is a static export; secret values cannot be toggled — see the distribution notice above."
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OPSEC Audit — Case {case_id}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --ink: #0d0f12;
    --panel: #15181a;
    --panel-raised: #191d20;
    --line: #262b2e;
    --text: #dde1e3;
    --muted: #7a8288;
    --muted-dim: #565d62;
    --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;
    --sans: 'IBM Plex Sans', -apple-system, 'Segoe UI', sans-serif;
  }}
  * {{ box-sizing: border-box; }}
  html {{ scroll-behavior: smooth; }}
  body {{
    background: var(--ink);
    color: var(--text);
    font-family: var(--sans);
    margin: 0;
    padding: 0 0 100px;
    font-size: 15px;
    line-height: 1.5;
  }}
  .sheet {{ max-width: 780px; margin: 0 auto; padding: 0 28px; }}

  .distribution-notice {{
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #3f8f6e;
    border: 1px solid #2c4b3e;
    background: #14201b;
    border-radius: 3px;
    padding: 8px 12px;
    margin: 20px 0 0;
  }}
  .distribution-notice-warn {{
    color: #c0433f;
    border-color: #4b2c2c;
    background: #201414;
  }}

  /* ---- Cover ---- */
  .cover {{
    border-bottom: 1px solid var(--line);
    padding: 48px 0 28px;
    margin-bottom: 8px;
  }}
  .cover-eyebrow {{
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
  }}
  .cover-title {{
    font-family: var(--mono);
    font-weight: 700;
    font-size: 26px;
    letter-spacing: -0.01em;
    margin: 6px 0 18px;
  }}
  .cover-meta {{
    display: flex;
    flex-wrap: wrap;
    gap: 20px 32px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
  }}
  .cover-meta strong {{ color: var(--text); font-weight: 500; }}
  .scope-note {{
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted-dim);
    margin-top: 10px;
  }}

  /* ---- Docket ---- */
  .docket {{ padding: 28px 0; border-bottom: 1px solid var(--line); }}
  .docket-heading {{
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
  }}
  .tallies {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }}
  .tally {{
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 14px 10px;
    text-align: center;
  }}
  .tally-stamp {{
    display: inline-block;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--stamp-color);
    border: 1.5px solid var(--stamp-color);
    border-radius: 2px;
    padding: 2px 6px;
    transform: rotate(-1.2deg);
    margin-bottom: 8px;
  }}
  .tally-count {{ font-family: var(--mono); font-size: 24px; font-weight: 600; }}

  .bar-row {{ display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 13px; }}
  .bar-label {{ flex: 0 0 160px; color: var(--muted); font-size: 12px; }}
  .bar-track {{ flex: 1; height: 6px; background: var(--panel); border-radius: 3px; overflow: hidden; }}
  .bar-fill {{ height: 100%; background: var(--muted-dim); border-radius: 3px; }}
  .bar-count {{ font-family: var(--mono); color: var(--muted); font-size: 12px; width: 20px; text-align: right; }}
  .docket-empty {{ color: var(--muted); font-size: 13px; font-style: italic; }}

  /* ---- Evidence log ---- */
  .log-heading {{
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 28px 0 16px;
  }}
  .entry {{
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 16px;
    padding: 18px 0;
    border-bottom: 1px solid var(--line);
  }}
  .entry-number {{
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted-dim);
    padding-top: 3px;
  }}
  .entry-head {{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }}
  .stamp {{
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--stamp-color);
    border: 1.5px solid var(--stamp-color);
    border-radius: 2px;
    padding: 2px 7px;
    transform: rotate(-1deg);
  }}
  .entry-score {{ font-family: var(--mono); font-size: 12px; color: var(--text); font-weight: 500; }}
  .entry-category {{ font-size: 13px; color: var(--muted); }}
  .entry-rule {{ font-family: var(--mono); font-size: 11px; color: var(--muted-dim); margin-left: auto; }}

  .evidence {{ margin-bottom: 12px; }}
  .evidence summary, .evidence-static {{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 3px;
  }}
  .evidence summary {{ cursor: pointer; list-style: none; }}
  .evidence summary::-webkit-details-marker {{ display: none; }}
  .evidence summary:focus-visible {{ outline: 2px solid #7a8288; outline-offset: 2px; }}
  .redacted-value {{
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--muted-dim);
    letter-spacing: 1px;
  }}
  .reveal-label {{
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-left: auto;
  }}
  .evidence[open] summary {{ border-color: #3a4046; }}
  .revealed-value {{
    display: block;
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 12.5px;
    color: #e2a878;
    background: var(--panel-raised);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 8px 10px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }}
  .revealed-value-static {{ margin-top: 0; width: 100%; }}

  .entry-fields {{ display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 10px; }}
  .field {{ display: flex; gap: 8px; font-size: 12px; }}
  .field-label {{ color: var(--muted-dim); flex: 0 0 auto; min-width: 110px; }}
  .field-value {{ color: var(--muted); font-family: var(--mono); font-size: 11.5px; word-break: break-all; }}

  .entry-note {{
    font-size: 12.5px;
    color: var(--muted);
    font-style: italic;
    margin: 8px 0 0;
    padding-left: 10px;
    border-left: 2px solid var(--line);
  }}

  .clean-record {{
    font-family: var(--mono);
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
    letter-spacing: 0.04em;
  }}

  /* ---- Footer ---- */
  .methodology {{
    padding: 28px 0 0;
    margin-top: 8px;
    font-size: 12px;
    color: var(--muted-dim);
  }}
  .methodology code {{ font-family: var(--mono); color: var(--muted); }}

  @media (max-width: 600px) {{
    .entry {{ grid-template-columns: 1fr; }}
    .entry-fields {{ grid-template-columns: 1fr; }}
    .tallies {{ grid-template-columns: repeat(2, 1fr); }}
    .bar-label {{ flex-basis: 110px; }}
  }}

  @media (prefers-reduced-motion: reduce) {{
    html {{ scroll-behavior: auto; }}
  }}

  @media print {{
    body {{ padding-bottom: 40px; }}
    .entry {{ break-inside: avoid; }}
    .tallies {{ break-inside: avoid; }}
  }}

  @page {{
    size: A4;
    margin: 16mm 14mm;
    @bottom-center {{
      content: "Case {case_id} · Page " counter(page) " of " counter(pages);
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      color: #7a8288;
    }}
  }}
</style>
</head>
<body>
  <div class="sheet">

    <header class="cover">
      <div class="cover-eyebrow">Chain of custody · self-audit</div>
      <h1 class="cover-title">OPSEC Leak Scanner — Case {case_id}</h1>
      <div class="cover-meta">
        <span>Generated <strong>{generated_at}</strong></span>
        <span>Findings <strong>{len(scored)}</strong> (post-deduplication)</span>
        <span>Formula <strong>severity × identity confidence × exposure</strong></span>
      </div>
      {scope_html}
      {distribution_notice}
    </header>

    <section class="docket">
      <div class="docket-heading">Docket summary</div>
      <div class="tallies">{stamp_tallies}</div>
      {category_html}
    </section>

    <section class="log">
      <div class="log-heading">Evidence log — ranked by risk</div>
      {entries_html}
    </section>

    <footer class="methodology">
      <p><code>risk_score = base_severity × identity_confidence × exposure_weight</code>, clamped to 10.0.
      Identity confidence reflects correlation against the target profile (direct match, domain match, GPS proximity,
      or generic/uncorrelated). Exposure reflects whether a finding sits in current history, an archived/dangling
      commit, or is confirmed public via <code>--public-repo</code>. {interactive_notice}</p>
    </footer>

  </div>
</body>
</html>"""

    return html


def render_dashboard(scored: list[ScoredFinding], output_path: str | Path, scan_stats: dict | None = None) -> None:
    """Entrypoint used by main.py for the interactive HTML report."""
    html = _build_html(scored, mode="interactive", scan_stats=scan_stats)
    with open(output_path, "w") as f:
        f.write(html)
