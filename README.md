# Responsive Sudoku Game

A responsive, interactive Sudoku game built with HTML5, CSS3, and vanilla
JavaScript. The application runs entirely in the browser and combines
generated puzzles, a PSL (puzzle-solution logic) validator, hints, solver
animation, notes, a timer, and local browser persistence in one accessible
interface.

This README is intended to stand on its own: screenshots are optional and are
not required to understand, run, or test the project.

## Project overview

The game creates a complete randomized Sudoku solution using backtracking,
removes values to create a puzzle, and checks that the resulting puzzle has
exactly one solution. Players can choose Easy, Medium, or Hard, enter values,
receive immediate feedback, and check the completed board.

The interface is designed for keyboard and touch use. The board remains square
as the viewport changes, controls wrap on smaller screens, focus states remain
visible, and reduced-motion preferences are respected.

## Core features

### PSL-generated validator

The puzzle-solution logic (PSL) generates a valid solved board and uses
constraint checks for rows, columns, and 3x3 boxes. A solution counter verifies
uniqueness while the puzzle is being created. During play, the validator:

- Accepts only digits 1 through 9 in editable cells.
- Compares entries with the generated solution.
- Marks incorrect cells with visual feedback and `aria-invalid`.
- Reports incomplete or incorrect boards through an accessible live status.
- Confirms a completed board and stops the timer when it is correct.

### Hint system

**Get hint** selects an empty editable cell, inserts its correct value, marks
the cell as a hint, locks it, and increments the hint count. Hint usage is
included in saved game data and leaderboard results.

### Solver animation

**Show solver steps** highlights the cells that still need solving in sequence.
It does not overwrite player values or automatically complete the puzzle. The
animation has a reduced-motion fallback so the same information remains
available without motion.

### Local storage data processing

The browser stores data locally under these keys:

- `sudoku-game` - current puzzle, solution, values, clue and hint state, notes,
  difficulty, elapsed time, and completion state.
- `sudoku-leaderboard` - up to 10 completed games sorted by fastest time.

Saved data is validated before restoration. Invalid or unreadable saved data is
discarded rather than being used to populate the board. No game data is sent
to a remote service.

### Additional gameplay features

- Easy, Medium, and Hard difficulty levels.
- Candidate notes through Note Mode.
- Number palette and placed-number tracking.
- Persistent elapsed timer.
- Top-10 leaderboard with player, time, difficulty, and hint count.
- New game control and automatic saved-game restoration.
- Light and dark themes.
- Semantic controls, cell labels, live status messages, and keyboard focus.

## Technology

- HTML5 semantic markup
- CSS3 custom properties, media queries, and animations
- Vanilla JavaScript (ES6+)
- Browser `localStorage`
- No framework, package manager, build process, or external runtime dependency

## Setup and installation

### Requirements

Use a current browser with JavaScript enabled. Chrome, Edge, Firefox, and
Safari are suitable. The project does not require Node.js or a package
installation.

### Run directly

1. Download or clone the project.
2. Open `index.html` in a browser.
3. Select a difficulty and optionally enter a player name.
4. Start playing. A new puzzle is generated automatically when no saved game
   is available.

### Run with a local server

Serving the files locally is recommended when testing browser behavior:

```text
python -m http.server 8000
```

Run the command from the project directory, then open
`http://localhost:8000` in a browser.

## How to play

1. Focus an editable cell and type a digit from 1 through 9.
2. Use **Check solution** to validate the board.
3. Use **Get hint** when assistance is needed.
4. Enable **Note mode**, focus a cell, and select numbers from the palette to
   add or remove candidate notes.
5. Select a number in the palette to see how many times it appears and
   highlight matching cells.
6. Use **Show solver steps** to review the remaining editable cells.
7. Complete the puzzle to stop the timer and record a leaderboard result.

## Testing the application

### Functional smoke test

1. Load the app and confirm that a 9x9 board appears.
2. Start each difficulty and confirm that the number of starting clues changes.
3. Enter a wrong value and confirm that the cell is marked invalid.
4. Replace it with the correct value and confirm that the invalid state clears.
5. Click **Get hint** and confirm that one empty cell is filled, highlighted,
   locked, and counted.
6. Toggle **Note mode**, select an editable cell, and add and remove notes.
7. Click a number in the palette and verify matching values are highlighted.
8. Run **Show solver steps** and confirm that values do not change.
9. Complete a puzzle and use **Check solution** to confirm the success message,
   timer stop, and leaderboard entry.

### Local storage test

1. Start a game and enter several values and notes.
2. Reload the page.
3. Confirm that the same puzzle, values, notes, hints, difficulty, and elapsed
   time are restored.
4. Finish a game and confirm that the leaderboard keeps the result after
   another reload.
5. Open browser developer tools, inspect **Application/Storage >
   Local Storage**, and verify the `sudoku-game` and
   `sudoku-leaderboard` entries.
6. Remove the saved-game entry and reload. Confirm that a fresh puzzle starts.

### Responsive layout test

Use browser developer tools' device emulation, or resize the browser window
manually, and test at least these viewport widths:

- 320px: small mobile portrait
- 375px: standard mobile portrait
- 768px: tablet portrait
- 1024px: tablet or small desktop
- 1440px: large desktop

At every width, verify that:

- The full Sudoku board fits within the viewport without horizontal scrolling.
- Each cell remains square and the 3x3 regions remain visually distinct.
- Header controls and game controls wrap without overlapping.
- The number palette remains usable and buttons have comfortable touch targets.
- The leaderboard remains readable and does not break the page layout.
- Text, borders, invalid states, hints, and focus outlines remain visible.
- The dark-mode toggle works at the same viewport widths.

Rotate a mobile emulator between portrait and landscape and repeat the checks.
Also test browser zoom at 200% to confirm that content remains usable and
keyboard focus is not clipped.

### Accessibility and motion test

- Navigate without a mouse using `Tab`, `Shift+Tab`, `Enter`, and arrow keys
  where applicable.
- Confirm every board cell has a descriptive row and column label.
- Confirm invalid values expose `aria-invalid="true"`.
- Confirm status messages are announced without requiring a visual change.
- Enable the operating system's reduced-motion preference and verify that
  solver highlighting does not rely on animation.

## Project structure

```text
.
├── index.html       # Semantic board, controls, status messages, leaderboard
├── styles.css       # Responsive layout, themes, focus states, animations
├── script.js        # Puzzle generation, validation, persistence, gameplay
├── prompts.json     # Reusable GitHub Copilot prompt templates
├── instruction.md   # Iterative development record
└── Screenshots/     # Optional development-stage screenshots
```

## Collaborative development process with GitHub

Development followed a small, incremental workflow using GitHub and GitHub
Copilot:

1. **Structure** - Created the semantic HTML board, controls, labels, and
   status regions.
2. **Presentation** - Added responsive CSS, 3x3 grid boundaries, theme
   support, focus states, and reduced-motion behavior.
3. **Puzzle logic** - Implemented randomized backtracking generation and
   unique-solution checking.
4. **Gameplay** - Added validation, hints, timer handling, and saved-game
   restoration.
5. **Progress tracking** - Added the leaderboard and completion workflow.
6. **Advanced tools** - Added number tracking, Note Mode, and solver-step
   animation.
7. **Review and verification** - Reviewed each change in the browser, tested
   keyboard and responsive behavior, and preserved earlier functionality while
   extending the app.

Prompt templates are maintained in [`prompts.json`](prompts.json). The
stage-by-stage development record is in
[`instruction.md`](instruction.md).

## Data and privacy

All game state stays in the current browser profile. Clearing site data,
switching browsers, or using private browsing can remove or isolate saved
games and leaderboard entries. The application has no server-side account,
analytics integration, or network API.

## License

No license has been specified for this project.
