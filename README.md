# Dungeon Escape: Monster Mind — Standalone AI Game

A polished, standalone browser game focused on Artificial Intelligence game-playing algorithms (**Minimax Algorithm with Alpha-Beta Pruning**).

---

## 🎮 The Six Game & AI Sections

1. **Game Arena**: The main gameplay arena. Pilot the Hero through tactical dungeon chambers, acquire the golden key, and unlock the exit portal while evading an AI-controlled Monster running real-time adversarial Minimax search.
2. **AI Lab**: Comprehensive interactive learning panels explaining only the AI methods used in the game: Minimax decision theory, Alpha-Beta bound updates and cutoffs, game state representation, the linear heuristic evaluation function, and search depth horizon dynamics.
3. **Search Tree Explorer**: Dedicated full-page interactive visualization of the actual Minimax search tree with MAX/MIN nodes, leaf evaluations, backed-up scores, $[\alpha, \beta]$ search windows, explored branches, and distinct pruned branches ($\beta \le \alpha$). Includes depth controls, move-ordering strategy controls, pan/zoom, and step playback.
4. **Step Debugger**: Granular execution trace of the search process synchronized with pseudocode line highlights, event logs, bounds updates, pruning cutoffs, and state coordinates.
5. **Heuristic Inspector**: Real-time evaluation of all candidate monster moves (UP, DOWN, LEFT, RIGHT, WAIT) from the active position, complete with individual score contributions and live adjustable heuristic weights that alter the monster's gameplay in real time.
6. **AI Performance**: Dedicated empirical benchmarking comparing Plain Minimax against Alpha-Beta Pruning, multi-depth sweeps ($d=1$ to $d=5$), move ordering impact tests, and proof of optimality invariance.

---

## 🧮 Heuristic Evaluation Function $h(S)$

From the Monster's perspective ($\text{MAX}$ player):

$$h(S) = W_{\text{catch}} \cdot (D_{\max} - D(M, H)) + W_{\text{key}} \cdot D(H, K) + W_{\text{exit}} \cdot D(H, E) + W_{\text{guard}} \cdot (D_{\max} - D(M, \text{obj})) - W_{\text{mob}} \cdot \text{Moves}(H)$$

- **Terminal States**:
  - Monster catches Hero: $+10,000 - 10 \times \text{depth}$
  - Hero triggers lethal spike trap: $+8,000 - 10 \times \text{depth}$
  - Hero escapes with key: $-10,000 + 10 \times \text{depth}$

---

## 🚀 Running Locally in VS Code

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- npm (bundled with Node.js)

### Instructions
1. Open the project folder in **Visual Studio Code**:
   ```bash
   code .
   ```
2. Open a new terminal in VS Code (`Terminal -> New Terminal` or ``Ctrl+` `` / ``Cmd+` ``).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Running Typechecks & Builds
- To verify type safety:
  ```bash
  npm run lint
  ```
- To create a production build:
  ```bash
  npm run build
  ```

---

## ⌨️ Controls
- **Hero Movement**: Arrow keys (`↑`, `↓`, `←`, `→`), `W`, `A`, `S`, `D`, or the tactile on-screen D-Pad.
- **Pass Turn**: `Space`, `Enter`, or the `WAIT` button.
- **Tree Navigation**: Click and drag to pan; mouse wheel or `Zoom In` / `Zoom Out` buttons to scale.
