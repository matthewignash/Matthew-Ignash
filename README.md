# Learning Map Viewer

A React-based learning map application rebuilt from Google Apps Script source files.

## Features

- **Hex-based Visualization**: View learning paths as a grid of interactive hexagons.
- **Builder Mode**: Create, edit, drag-and-drop, and organize hex nodes.
- **Persistent Storage**: Mocks Google Apps Script backend using local browser storage for saving maps.
- **Responsive Design**: Built with Tailwind CSS.

## Usage

1. **Select a Map**: Choose a learning map from the dropdown in the toolbar.
2. **Builder Mode**: Toggle the "Builder Mode" checkbox to enable editing.
   - **Add Hexes**: Use "+ Core" or "+ Ext" buttons.
   - **Move**: Drag hexes to snap them to the grid.
   - **Edit**: Click a hex to open the sidebar editor.
   - **Save**: Click "Save" to persist changes to your browser's local storage.
3. **Student View**: When Builder Mode is off, clicking a hex opens its linked resource (if configured).
