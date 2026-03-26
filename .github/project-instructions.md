# Copilot Instructions for react-planner

## Commands

```bash
npm start          # Dev server at localhost:9000 (serves demo app)
npm run build      # Full build: clean + demo + commonjs (lib/) + ES modules (es/)
npm run build-commonjs  # Transpile src/ → lib/ (CommonJS)
npm run build-es        # Transpile src/ → es/ (ES modules)
npm run clean      # Remove lib/, es/, demo/dist/
```

No test framework is configured (`npm test` currently fails).

## Architecture

**react-planner** is a Redux-connected React component for drawing 2D floor plans with 3D visualization.

### State Management

All state lives in a single **Immutable.js Record** tree (see `src/models.js`). The parent app owns the Redux store; react-planner only manages its slice via a `stateExtractor` prop.

```
State
├── mode              # Current tool mode (MODE_IDLE, MODE_DRAWING_LINE, etc.)
├── scene
│   ├── layers        # Map of Layer (each has vertices, lines, holes, areas, items)
│   ├── groups        # Map of Group (multi-element selections)
│   ├── grids         # Visual grid definitions
│   └── guides        # Snap guides (horizontal, vertical, circular)
├── sceneHistory      # Undo/redo stack
├── catalog           # Registered element definitions
├── viewer2D / viewer3D  # Viewport transform state
└── drawingSupport / draggingSupport / rotatingSupport  # Transient interaction state
```

The root reducer in `src/reducers/reducer.js` routes actions to domain sub-reducers based on action type group (PROJECT_ACTIONS, VIEWER2D_ACTIONS, ITEMS_ACTIONS, etc.).

### Domain Elements

Five core element types, each with its own actions file, reducer file, and render components:

| Type | Description |
|------|-------------|
| `vertices` | Points where lines meet |
| `lines` | Walls / structural edges |
| `holes` | Doors & windows (attached to lines) |
| `areas` | Enclosed rooms (auto-derived from line topology) |
| `items` | Furniture / fixtures (free-placed with position & rotation) |

Layers allow stacking multiple floor levels; only one layer is active at a time (`selectedLayer`).

### Catalog System

The catalog (`src/catalog/catalog.js`) is the registry of draggable element prototypes. Each element defines:
- Metadata (name, category, tags)
- A set of typed **properties** (string, number, color, enum, length-measure, toggle, etc.) with defaults and UI editors in `src/catalog/properties/`
- 2D factory function (renders SVG)
- 3D factory function (returns Three.js mesh)

See `docs/HOW_TO_CREATE_AN_ELEMENT.md` and `docs/HOW_TO_CREATE_A_CATALOG.md`.

### Component Structure

```
src/components/
├── viewer2d/     # SVG-based pan/zoom canvas (react-svg-pan-zoom)
├── viewer3d/     # Three.js 3D scene
├── sidebar/      # Property panels, layer manager, group editor
├── toolbar/      # Tool buttons (mode switchers)
├── footerbar/    # Zoom, units, coordinates display
└── content.jsx   # Switches between 2D and 3D based on mode
```

`src/react-planner.jsx` is the root component. It provides `actions`, `translator`, and `catalog` via React **legacy context** (`childContextTypes`) so deeply nested components can access them without prop drilling.

### Plugin System

Plugins are functions `(store, stateExtractor) => void` called at mount time. They can subscribe to the Redux store for side effects:

```js
// Built-ins in src/plugins/
Plugins.Autosave('my-key')   // Persist scene to localStorage
Plugins.Keyboard()           // Ctrl+Z undo, Delete key, etc.
Plugins.ConsoleDebugger()    // Log actions to console
```

## Key Conventions

### File Naming

- Components: `kebab-case.jsx`
- Actions / reducers: `entity-actions.js`, `entity-reducer.js`
- Constants: `SCREAMING_SNAKE_CASE` (action types and mode names in `src/constants.js`)

### Immutable Updates

All state mutations go through Immutable.js methods (`.set()`, `.update()`, `.merge()`, `.setIn()`). Never mutate state directly. Reducers always return a new state object.

```js
// Typical reducer pattern:
return state
  .setIn(['scene', 'layers', layerID, 'lines', lineID, 'selected'], true)
  .updateIn(['scene', 'layers', layerID, 'selected', 'lines'], s => s.add(lineID));
```

### Action Creators

Actions are plain objects. Action creators in `src/actions/` return `{type, ...payload}`. The action type strings are defined in `src/constants.js` and grouped into exported maps (`PROJECT_ACTIONS`, `ITEMS_ACTIONS`, etc.) which the root reducer uses for routing.

### Adding a New Element Property Type

1. Create editor component in `src/catalog/properties/`
2. Register it with `catalog.registerPropertyType(name, component)`
3. Reference the type name in element property definitions

### Tech Stack

- **React 16.8** — class components (no hooks used in library code)
- **Redux 4 + react-redux 5** — state management
- **Immutable.js 3** — all state is immutable Records/Maps
- **Three.js 0.94** — 3D rendering (peer dependency, must be provided by host app)
- **Babel 6** — transpilation (babel-preset-env + babel-preset-react)
- **Webpack 4** — demo bundling only; library output uses Babel CLI
