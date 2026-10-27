#!/usr/bin/env bash
# lint-staged hook for Swift: formats with swift format, applies swift-style fixes, then fails on anything left.
# CI runs the same checks, so machines without a Swift toolchain skip with a warning instead of blocking commits.
set -euo pipefail

if ! command -v swift >/dev/null 2>&1; then
  echo "swift not found; skipping Swift format and style checks (CI still runs them)." >&2
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"
package="$repo_root/shared/swift-style"
checker="$package/.build/debug/swift-style"

swift format --in-place "$@"
swift format lint --strict "$@"

if [[ ! -x "$checker" || -n "$(find "$package/Sources" "$package/Package.swift" -newer "$checker" -print -quit)" ]]; then
  echo "Building swift-style (first run takes a minute)..." >&2
  swift build --package-path "$package" --product swift-style >&2
fi

"$checker" --fix "$@"
