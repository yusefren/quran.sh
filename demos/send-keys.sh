#!/bin/bash
#
# TUI Demo Keystroke Script
#
# Records a full TUI demo via terminalizer inside a tmux session.
#
# Usage:
#   1. Start a tmux session:      tmux new-session -d -s demo -x 120 -y 35
#   2. Start terminalizer in it:  tmux send-keys -t demo 'terminalizer record --config demos/tui-demo.yml demos/tui-full -k' Enter
#   3. Run this script:           bash demos/send-keys.sh
#   4. Render the GIF:            terminalizer render demos/tui-full
#
# Or with asciinema:
#   1. Start a tmux session:      tmux new-session -d -s demo -x 120 -y 35
#   2. Start asciinema in it:     tmux send-keys -t demo 'asciinema rec --cols 120 --rows 35 demos/tui-demo.cast' Enter
#   3. Start the TUI in it:       tmux send-keys -t demo 'bun run src/index.ts' Enter
#   4. Run this script:           bash demos/send-keys.sh
#   5. Upload:                    asciinema upload demos/tui-demo.cast
#

SESSION="demo"

echo "Waiting for TUI to start..."
sleep 35

echo ">> Tab to Arabic pane"
tmux send-keys -t $SESSION Tab
sleep 2

echo ">> Navigate verses (j j j)"
tmux send-keys -t $SESSION j; sleep 0.8
tmux send-keys -t $SESSION j; sleep 0.8
tmux send-keys -t $SESSION j; sleep 1

echo ">> Tab back to sidebar, navigate surahs"
tmux send-keys -t $SESSION Tab; sleep 2
tmux send-keys -t $SESSION j; sleep 0.5
tmux send-keys -t $SESSION j; sleep 0.5
tmux send-keys -t $SESSION j; sleep 0.5
tmux send-keys -t $SESSION k; sleep 0.5
tmux send-keys -t $SESSION k; sleep 1.5

echo ">> Toggle transliteration (r) — shows 3-pane layout"
tmux send-keys -t $SESSION r; sleep 2

echo ">> Cycle focus through all panes (Tab x3)"
tmux send-keys -t $SESSION Tab; sleep 1
tmux send-keys -t $SESSION Tab; sleep 1
tmux send-keys -t $SESSION Tab; sleep 2

echo ">> Toggle transliteration off (r)"
tmux send-keys -t $SESSION r; sleep 2

echo ">> Toggle sidebar off (s)"
tmux send-keys -t $SESSION s; sleep 2

echo ">> Toggle sidebar on (s)"
tmux send-keys -t $SESSION s; sleep 2

echo ">> Increase verse spacing (+ + +)"
tmux send-keys -t $SESSION +; sleep 0.8
tmux send-keys -t $SESSION +; sleep 0.8
tmux send-keys -t $SESSION +; sleep 1.5

echo ">> Decrease verse spacing (- - -)"
tmux send-keys -t $SESSION -- -; sleep 0.8
tmux send-keys -t $SESSION -- -; sleep 0.8
tmux send-keys -t $SESSION -- -; sleep 1.5

echo ">> Show help (?)"
tmux send-keys -t $SESSION ?; sleep 3

echo ">> Dismiss help (?)"
tmux send-keys -t $SESSION ?; sleep 1

echo ">> Quit (q)"
tmux send-keys -t $SESSION q; sleep 2

echo ">> Stop recording (Ctrl-D)"
tmux send-keys -t $SESSION C-d; sleep 2

echo ">> Decline share prompt"
tmux send-keys -t $SESSION n Enter; sleep 1

echo "Done! Recording saved."
