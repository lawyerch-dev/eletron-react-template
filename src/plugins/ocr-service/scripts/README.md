# RapidOCR sidecar（Cherry Studio 风格）

不内置 Python 包。宿主通过 **uv** 按需解析依赖并 STDIO 启动 `rapidocr_runner.py`。

## 运行方式（自动）

```bash
uv run --directory src/plugins/ocr-service/scripts --quiet python rapidocr_runner.py '{"probe": true}'
```

依赖声明在本目录 `pyproject.toml`（`rapidocr>=3` + `onnxruntime`），由 uv 缓存到全局 cache，不进仓库。

## 优先级

1. `uv run --directory scripts`（推荐）
2. 插件目录 `.venv`（可选，`setup_rapidocr.sh` 创建）
3. `RAPIDOCR_PYTHON` 或系统 Python（需已 `pip install rapidocr onnxruntime`）

## 安装 uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# 或
brew install uv
```

## 可选：本地钉死环境

```bash
./setup_rapidocr.sh
```

## 协议

请求（argv JSON 或 stdin）：

```json
{"probe": true}
{"image_path": "/abs/img.png"}
{"image_base64": "<base64>", "lang": "chi_sim"}
```

响应（stdout 单行 JSON）：

```json
{"ok": true, "text": "...", "confidence": 99.1, "lines": [{"text":"","confidence":0,"bbox":[]}], "elapse": 0.2}
```
