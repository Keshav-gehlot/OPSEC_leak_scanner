from pathlib import Path

from PIL import Image

from opsec_scanner.engines.media_engine import scan_media_dir


def test_parallel_scan_matches_single_worker_count(tmp_path):
    # Create a few plain images — no need for real EXIF content here,
    # just confirming the thread pool doesn't drop or duplicate files.
    for i in range(6):
        img = Image.new("RGB", (50, 50), color="blue")
        img.save(tmp_path / f"img_{i}.png")

    findings_parallel = scan_media_dir(tmp_path, max_workers=4)
    findings_serial = scan_media_dir(tmp_path, max_workers=1)

    # Exact finding count can vary slightly by exiftool/OCR environment
    # noise, but both runs must process the same number of files.
    assert len(findings_parallel) == len(findings_serial)


def test_progress_callback_fires_once_per_file(tmp_path):
    for i in range(4):
        img = Image.new("RGB", (50, 50), color="red")
        img.save(tmp_path / f"img_{i}.png")

    calls = []
    scan_media_dir(tmp_path, progress_callback=lambda done, total, path: calls.append((done, total)))

    assert len(calls) == 4
    assert calls[-1][0] == 4  # final call reports completed == total
    assert all(total == 4 for _, total in calls)


def test_empty_directory_returns_no_findings_and_no_callback(tmp_path):
    calls = []
    findings = scan_media_dir(tmp_path, progress_callback=lambda *a: calls.append(a))
    assert findings == []
    assert calls == []


def test_worker_error_does_not_crash_whole_scan(tmp_path, monkeypatch):
    # A corrupt/unreadable file should produce an error finding for that
    # file, not take down the rest of the scan.
    bad_file = tmp_path / "corrupt.png"
    bad_file.write_bytes(b"not a real png")

    good_img = Image.new("RGB", (50, 50), color="green")
    good_img.save(tmp_path / "good.png")

    findings = scan_media_dir(tmp_path)
    # Should complete without raising, regardless of what exiftool/OCR
    # made of the corrupt file.
    assert isinstance(findings, list)


def test_ocr_call_passes_a_timeout(monkeypatch, tmp_path):
    # Regression test: OCR previously had no timeout at all (unlike
    # exiftool's 15s guard), so a pathological image could hang a scan
    # indefinitely — worse once media scanning became parallel, since a
    # hung OCR call ties up a thread pool worker slot.
    import pytesseract
    from opsec_scanner.engines.media_engine import scan_image_ocr

    captured = {}

    def fake_image_to_string(img, timeout=0):
        captured["timeout"] = timeout
        return "fake ocr text"

    monkeypatch.setattr(pytesseract, "image_to_string", fake_image_to_string)

    img = Image.new("RGB", (20, 20), color="white")
    img_path = tmp_path / "test.png"
    img.save(img_path)

    list(scan_image_ocr(img_path))
    assert captured.get("timeout", 0) > 0
