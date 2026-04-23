#!/usr/bin/env bash
set -euo pipefail

# Create a new background window in the current governor tmux session.
# Used by Captain/Halo to launch role agents or background tasks.

usage() {
  cat <<'USAGE'
Usage: tmux-spawn-window.sh -n <name> -c <command> [-s]

Options:
  -n, --name      Window name (required)
  -c, --command   Command to run (required)
  -s, --switch    Switch to the new window (default: stay in current)
  -h, --help      Show this help

Examples:
  tmux-spawn-window.sh -n "dev" -c "claude"
  tmux-spawn-window.sh -n "build" -c "npm run build"
USAGE
}

name=""
command=""
switch=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--name)    name="${2:-}"; shift 2 ;;
    -c|--command) command="${2:-}"; shift 2 ;;
    -s|--switch)  switch=true; shift ;;
    -h|--help)    usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$name" || -z "$command" ]]; then
  echo '{"error": "--name and --command are required"}' >&2
  exit 1
fi

if ! tmux display-message -p '#{session_name}' >/dev/null 2>&1; then
  echo '{"error": "Not running inside tmux"}' >&2
  exit 1
fi

session=$(tmux display-message -p '#{session_name}')

tmux_args=(-n "$name" -P -F '#{window_id}:#{window_index}')
if [[ "$switch" == "false" ]]; then
  tmux_args=(-d "${tmux_args[@]}")
fi

window_info=$(tmux new-window "${tmux_args[@]}" "$command")
window_id=$(echo "$window_info" | cut -d: -f1)
window_index=$(echo "$window_info" | cut -d: -f2)
target="$session:$window_index.0"

cat <<EOF
{
  "success": true,
  "session": "$session",
  "window_id": "$window_id",
  "window_index": $window_index,
  "window_name": "$name",
  "target": "$target",
  "command": $(printf '%s' "$command" | jq -Rs .),
  "switched": $switch
}
EOF
