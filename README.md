# Move Panels

> **Alpha version.** I made this plugin for my own use. It is not in the Obsidian community plugin list. It can change or break without notice.

An Obsidian plugin. It moves the active note to the pane on the left, right, top, or bottom.

## Commands

- Move Panels: Move note to left pane (ml)
- Move Panels: Move note to right pane (mr)
- Move Panels: Move note to top pane (mu)
- Move Panels: Move note to bottom pane (md)

The note goes in as the last tab of the nearest pane in that direction.
If no pane is in that direction and the current pane has more than one tab, the plugin makes a new split.
The note keeps its scroll position, its cursor position, and its pinned state.

Each command name ends with a short code (ml, mr, mu, md). Type the code in the command palette to find the command fast.

To set hotkeys, go to Settings > Hotkeys and search "Move Panels".

## Build and install

```sh
npm install
npm run build
mkdir -p <vault>/.obsidian/plugins/move-panels
cp main.js manifest.json <vault>/.obsidian/plugins/move-panels/
```

Then enable "Move Panels" in Settings > Community plugins.
