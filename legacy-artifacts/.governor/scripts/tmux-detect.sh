#!/usr/bin/env bash
set -euo pipefail

# Detect current tmux session and return JSON with governor context.
# Returns session info including which governor app and role window we're in.

if ! tmux display-message -p '#{session_name}' >/dev/null 2>&1; then
  echo '{"in_tmux": false}'
  exit 0
fi

session=$(tmux display-message -p '#{session_name}')
window=$(tmux display-message -p '#{window_index}')
window_name=$(tmux display-message -p '#{window_name}')
pane=$(tmux display-message -p '#{pane_index}')
pane_id=$(tmux display-message -p '#{pane_id}')

# Detect governor context from session name (format: governor-<app_name>)
gov_app=""
if [[ "$session" == governor-* ]]; then
  gov_app="${session#governor-}"
fi

cat <<EOF
{
  "in_tmux": true,
  "session": "$session",
  "window": $window,
  "window_name": "$window_name",
  "pane": $pane,
  "pane_id": "$pane_id",
  "target": "$session:$window.$pane",
  "governor_app": "$gov_app"
}
EOF
