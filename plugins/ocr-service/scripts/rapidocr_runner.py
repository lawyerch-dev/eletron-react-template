#!/usr/bin/env python3
"""RapidOCR sidecar for the Electron OCR plugin.

Reads a JSON request from argv[1] or stdin:
  {"image_path": "/abs/path.png"}  or  {"image_base64": "<base64>"}
  optional: {"use_angle_cls": true}

Prints a single JSON line:
  {"ok": true, "text": "...", "confidence": 95.2, "lines": [...], "elapse": 0.5}
  {"ok": false, "error": "..."}
"""
from __future__ import annotations

import base64
import json
import os
import sys
import tempfile
import traceback
from pathlib import Path
from typing import Any


def _fail(message: str) -> None:
    print(json.dumps({"ok": False, "error": message}, ensure_ascii=False))
    sys.exit(1)


def _load_request() -> dict[str, Any]:
    if len(sys.argv) > 1 and sys.argv[1].strip():
        raw = sys.argv[1]
    else:
        raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw else {}
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON request: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("request must be a JSON object")
    return data


def _resolve_image(request: dict[str, Any]) -> tuple[Any, Path | None]:
    """Return (engine_input, temp_path_to_cleanup)."""
    image_path = request.get("image_path")
    if isinstance(image_path, str) and image_path:
        path = Path(image_path)
        if not path.is_file():
            raise FileNotFoundError(f"image not found: {image_path}")
        return str(path), None

    image_b64 = request.get("image_base64")
    if isinstance(image_b64, str) and image_b64:
        if "," in image_b64[:64] and image_b64.strip().startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]
        try:
            raw = base64.b64decode(image_b64)
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"invalid base64 image: {exc}") from exc
        suffix = ".png"
        # sniff jpeg/webp magic
        if raw[:3] == b"\xff\xd8\xff":
            suffix = ".jpg"
        elif raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
            suffix = ".webp"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            tmp.write(raw)
            tmp.flush()
        finally:
            tmp.close()
        return tmp.name, Path(tmp.name)

    raise ValueError("request must include image_path or image_base64")


def _to_list(value: Any) -> list[Any]:
    if value is None:
        return []
    try:
        return list(value)
    except TypeError:
        return []


def main() -> None:
    try:
        request = _load_request()

        # 环境探针：仅检查 rapidocr 是否可导入
        if request.get("probe"):
            try:
                from rapidocr import RapidOCR  # noqa: F401

                print(
                    json.dumps(
                        {
                            "ok": True,
                            "probe": True,
                            "python": sys.version.split()[0],
                            "engine": "rapidocr",
                        },
                        ensure_ascii=False,
                    )
                )
                return
            except Exception as exc:  # noqa: BLE001
                _fail(f"rapidocr not available: {exc}")

        image_input, temp_path = _resolve_image(request)
        try:
            from rapidocr import RapidOCR

            engine = RapidOCR()
            result = engine(image_input)
        finally:
            if temp_path is not None:
                try:
                    temp_path.unlink(missing_ok=True)
                except OSError:
                    pass

        txts = _to_list(getattr(result, "txts", None))
        scores = _to_list(getattr(result, "scores", None))
        boxes = getattr(result, "boxes", None)
        box_list: list[Any] = []
        if boxes is not None:
            try:
                for box in boxes:
                    box_list.append([[float(p[0]), float(p[1])] for p in box])
            except Exception:  # noqa: BLE001
                box_list = []

        lines = []
        for i, text in enumerate(txts):
            score = float(scores[i]) if i < len(scores) else 0.0
            # RapidOCR scores are typically 0-1
            if score <= 1.0:
                score *= 100.0
            lines.append(
                {
                    "text": str(text),
                    "confidence": round(score, 2),
                    "bbox": box_list[i] if i < len(box_list) else [],
                }
            )

        confidences = [ln["confidence"] for ln in lines] or [0.0]
        payload = {
            "ok": True,
            "text": "\n".join(ln["text"] for ln in lines),
            "confidence": round(sum(confidences) / len(confidences), 2),
            "lines": lines,
            "elapse": float(getattr(result, "elapse", 0.0) or 0.0),
            "engine": "rapidocr",
            "python": sys.version.split()[0],
        }
        print(json.dumps(payload, ensure_ascii=False))
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc(file=sys.stderr)
        _fail(str(exc))


if __name__ == "__main__":
    # Allow running as: python rapidocr_runner.py  (JSON on stdin)
    # Ensure UTF-8 stdout on Windows
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001
            pass
    main()
