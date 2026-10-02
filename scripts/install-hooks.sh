#!/bin/sh
# Instala el hook de pre-commit versionado en este repo (los hooks de .git/ no se suben a GitHub).
# Uso (Git Bash / Linux / macOS):  sh scripts/install-hooks.sh
set -e
ROOT=$(git rev-parse --show-toplevel)
cp "$ROOT/scripts/git-hooks/pre-commit" "$ROOT/.git/hooks/pre-commit"
chmod +x "$ROOT/.git/hooks/pre-commit"
echo "Hook pre-commit instalado en $ROOT/.git/hooks/pre-commit"
