#!/usr/bin/env bash
set -euo pipefail

# Capture recent output from any tmux pane without switching to it.
# Used by Captain/Halo to read role output, or by operator to check on background work.

usage() {
  cat <<'USAGE'
Usage: tmux-capture.sh [-t <target>] [-l lines] [-j]

Options:
  -t, --target    Tmux target (session:window.pane). Default: current pane
  -w, --window    Window name to capture (resolves to target automatically)
  -l, --lines     Number of lines to capture (default: 100)
  -j, --json      Output as JSON with metadata
  -h, --help      Show this help

Examples:
  tmux-capture.sh -w dev -l 50
  tmux-capture.sh -t "governor-nexxus:2.0" --json
  tmux-capture.sh -w ghost -j
USAGE
}

target=""
window_name=""
lines=100
json_output=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--target) target="${2:-}"; shift 2 ;;
    -w|--window) window_name="${2:-}"; shift 2 ;;
    -l|--lines)  lines="${2:-100}"; shift 2 ;;
    -j|--json)   json_output=true; shift ;;
    -h|--help)   usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if ! tmux display-message -p '#{session_name}' >/dev/null 2>&1; then
  echo "Error: Not running inside tmux" >&2
  exit 1
fi

session=$(tmux display-message -p '#{session_name}')

# Resolve window name to target if provided
if [[ -n "$window_name" && -z "$target" ]]; then
  window_index=$(tmux list-windows -t "$session" -F '#{window_index} #{window_name}' \
    | awk -v name="$window_name" '$2 == name {print $1; exit}')
  if [[ -z "$window_index" ]]; then
    if [[ "$json_output" == "true" ]]; then
      echo '{"error": "Window not found", "window_name": "'"$window_name"'"}'
    else
      echo "Error: Window '$window_name' not found in session '$session'" >&2
    fi
    exit 1
  fi
  target="$session:$window_index.0"
fi

# Default to current pane
if [[ -z "$target" ]]; then
  window=$(tmux display-message -p '#{window_index}')
  pane=$(tmux display-message -p '#{pane_index}')
  target="$session:$window.$pane"
fi

output=$(tmux capture-pane -p -J -t "$target" -S "-${lines}" 2>&1) || {
  if [[ "$json_output" == "true" ]]; then
    echo '{"error": "Failed to capture pane", "target": "'"$target"'"}'
  else
    echo "Error: Failed to capture pane $target" >&2
  fi
  exit 1
}

if [[ "$json_output" == "true" ]]; then
  cat <<EOF
{
  "target": "$target",
  "session": "$session",
  "lines": $lines,
  "output": $(printf '%s' "$output" | jq -Rs .)
}
EOF
else
  printf '%s\n' "$output"
fi
