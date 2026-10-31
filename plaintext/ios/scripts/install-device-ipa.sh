#!/usr/bin/env bash
# Install a CI-built Plaintext.ipa onto a plugged-in iPhone.
set -euo pipefail

ipa=${1:?usage: install-device-ipa.sh path/to/Plaintext.ipa}

if [ ! -f "$ipa" ]; then
  echo "No IPA at $ipa" >&2
  exit 1
fi

if ! command -v xcrun >/dev/null; then
  echo "xcrun is missing. Install Xcode command-line tools." >&2
  exit 1
fi

device=${DEVICE_ID:-}
if [ -z "$device" ]; then
  device=$(xcrun devicectl list devices --hide-default-columns --columns Identifier,Name,State \
    | awk -F'[[:space:]]{2,}' '
        /iPhone/ && /connected/ {
          print $1
          exit
        }
      ')
fi

if [ -z "$device" ]; then
  echo "No connected iPhone. Unlock it, trust this Mac, and try again." >&2
  xcrun devicectl list devices >&2 || true
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
unzip -q "$ipa" -d "$work"
app=$(find "$work/Payload" -name '*.app' -maxdepth 1 -type d | head -1)
if [ -z "$app" ]; then
  echo "IPA has no Payload/*.app" >&2
  exit 1
fi

echo "Installing $(basename "$app") on $device"
xcrun devicectl device install app --device "$device" "$app"
xcrun devicectl device process launch --device "$device" com.novembersierra.plaintext
echo "Installed and launched Plaintext."
