# Arcade II

**Arcade II** is an HTML5 platform game with light RPG elements and a built-in world editor. Originally developed with React, TypeScript and a Node.js-based toolchain, the project is now being maintained and extended with AI assistance as **dependency-free vanilla JavaScript**.

The goal remains the same: a small, playable platform adventure with multiple maps, characters, enemies, items and quests — and tools to build more of it.

## Run it

Download or clone the project and open **`index.html`** in a web browser. Keep the `js`, `styles`, `images` and `audio` folders alongside it.

No installation, npm, build step, framework or local server is required. The game is designed to work directly from `file://` and offline.

## Current features

- Tile-based platform gameplay with parallax backgrounds and multiple linked maps.
- Player attributes, experience points and character progression.
- Collectible items, item usage, combat and enemies with pursuit and respawning behavior.
- Friendly characters, conversations, quests and event triggers.
- Music and sound effects using local assets.
- Built-in map editor, plus sprite and environment atlas tools.
- Import/export of complete worlds as JSON files, including support for legacy world data.
- Separation between the editable world and the temporary state of a play session.
- A two-map demo, **The Fisher & Charles**, featuring the fisherman, Charles the horse, quests and enemies. This is a new demo, not a recovery of the original database world.

## Controls

| In game | Key |
| --- | --- |
| Move | Left / Right arrows |
| Jump | Space |
| Attack | Ctrl |
| Interact / talk / enter | E |
| Character attributes | Tab |
| Menu | F2 |

In the map editor, use the arrow keys to move the cursor, **1–8** to place objects, **9** to switch maps, **0** to delete, and **+ / -** to adjust a selection. Use the toolbar to load and save JSON worlds. Save your work before closing the browser: changes are kept in memory until exported.

## Project goals

The original vision is still the roadmap:

- **Grow the adventure:** more maps, level design, graphics, music and sound effects.
- **Deepen the RPG layer:** meaningful quests, NPC interactions, items and character progression.
- **Improve the editor:** make creating, linking and testing worlds easier.
- **Improve platform geometry:** remove the original restriction of one floor height per map column.
- **Keep it simple and portable:** readable vanilla JS, offline `file://` support, no runtime frameworks and no build pipeline.

## Development and testing

Source files can be edited directly; reload the page to see changes. A built-in browser self-test is available by opening `index.html?selftest=1` (the test report also records automated checks performed during the conversion).

The original server-side database content was not included in the available source archive. Current demo content is newly created from the retained assets and systems; original exported worlds can be loaded from JSON when available.

## Credits

Original project and concept: **fish23**. Thanks to **kontrolor** and **qandasim** for their game development support.

Current modernization and ongoing development: **human–AI collaboration**.
