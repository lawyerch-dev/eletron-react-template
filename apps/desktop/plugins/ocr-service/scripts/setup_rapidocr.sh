#!/usr/bin/env bash
# 可选：为离线/钉死版本创建插件本地 .venv
# 日常使用无需执行——宿主会优先用 uv run 按需拉起环境（Cherry Studio 风格）。
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="$DIR/scripts"
cd "$DIR"

if ! command -v uv >/dev/null 2>&1; then
  echo "未找到 uv。请安装: https://docs.astral.sh/uv/" >&2
  echo "或 curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 1
fi

echo "使用 uv 创建隔离环境..."
uv venv .venv
uv pip install --python ./.venv/bin/python 'rapidocr>=3' onnxruntime

echo "验证 probe..."
./.venv/bin/python "$SCRIPTS/rapidocr_runner.py" '{"probe": true}'
echo "完成。宿主会自动优先使用该 .venv（若存在），否则用 uv run。"
