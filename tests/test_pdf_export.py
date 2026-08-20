from pypdf import PdfReader

from opsec_scanner.output.pdf_export import export_pdf
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_findings
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import RawFinding, SourceType


def _scored_with_secret(secret_text="postgres://admin:Password123@db.internal.co:5432/main"):
    profile = TargetProfile(name="Test")
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=secret_text, origin="repo/config.py", context="commit abc123")
    match = ScannedMatch(finding=finding, rule_id="db_connection_string", category="credentials", base_severity=9.0, matched_text=secret_text)
    return score_findings([match], profile)


def _pdf_text(path) -> str:
    reader = PdfReader(str(path))
    return "".join(page.extract_text() for page in reader.pages)


def test_pdf_generates_valid_multipage_file(tmp_path):
    scored = _scored_with_secret()
    output = tmp_path / "report.pdf"
    export_pdf(scored, output)
    assert output.exists()
    reader = PdfReader(str(output))
    assert len(reader.pages) >= 1


def test_pdf_redacts_secrets_by_default(tmp_path):
    secret = "postgres://admin:Password123@db.internal.co:5432/main"
    scored = _scored_with_secret(secret)
    output = tmp_path / "report_redacted.pdf"
    export_pdf(scored, output)  # reveal defaults to False

    text = _pdf_text(output)
    assert secret not in text
    assert "█" in text
    assert "redacted" in text.lower()


def test_pdf_reveals_secrets_when_opted_in(tmp_path):
    secret = "postgres://admin:Password123@db.internal.co:5432/main"
    scored = _scored_with_secret(secret)
    output = tmp_path / "report_revealed.pdf"
    export_pdf(scored, output, reveal=True)

    text = _pdf_text(output)
    assert secret in text
    assert "do not distribute" in text.lower()


def test_pdf_handles_empty_findings(tmp_path):
    output = tmp_path / "report_clean.pdf"
    export_pdf([], output)
    assert output.exists()
    text = _pdf_text(output)
    assert "RECORD CLEAN" in text
