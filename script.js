const themeToggle = document.querySelector("#theme-toggle");
const root = document.documentElement;
const difficultySelect = document.querySelector("#difficulty");
const newGameButton = document.querySelector("#new-game");
const hintButton = document.querySelector("#hint");
const noteModeButton = document.querySelector("#note-mode");
const solverAnimationButton = document.querySelector("#solver-animation");
const checkSolutionButton = document.querySelector("#check-solution");
const numberPalette = document.querySelector("#number-palette");
const numberStatus = document.querySelector("#number-status");
const playerNameInput = document.querySelector("#player-name");
const timerDisplay = document.querySelector("#timer");
const leaderboardBody = document.querySelector("#leaderboard-body");
const status = document.querySelector("#game-status");
const cells = [...document.querySelectorAll("table input")];
const clueCounts = { easy: 45, medium: 36, hard: 30 };
const storageKey = "sudoku-game";
const leaderboardKey = "sudoku-leaderboard";
let solution = [];
let elapsedSeconds = 0;
let gameStartedAt = 0;
let gameCompleted = false;
let hintsUsed = 0;
let noteMode = false;
let solverRunning = false;
let timerInterval;

themeToggle.addEventListener("click", () => {
  const isDark = root.dataset.theme !== "dark";
  root.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
});

function shuffledNumbers() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
}

function shuffledPositions() {
  return Array.from({ length: 81 }, (_, index) => index)
    .sort(() => Math.random() - 0.5);
}

function isSafe(board, row, column, value) {
  for (let index = 0; index < 9; index += 1) {
    if (board[row][index] === value || board[index][column] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      if (board[boxRow + rowOffset][boxColumn + columnOffset] === value) {
        return false;
      }
    }
  }
  return true;
}

function fillBoard(board, position = 0) {
  if (position === 81) {
    return true;
  }

  const row = Math.floor(position / 9);
  const column = position % 9;
  for (const value of shuffledNumbers()) {
    if (isSafe(board, row, column, value)) {
      board[row][column] = value;
      if (fillBoard(board, position + 1)) {
        return true;
      }
      board[row][column] = 0;
    }
  }
  return false;
}

function createSolvedBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  return board;
}

function countSolutions(board, limit = 2, position = 0, count = 0) {
  if (count >= limit) {
    return count;
  }
  if (position === 81) {
    return count + 1;
  }

  const row = Math.floor(position / 9);
  const column = position % 9;
  if (board[row][column] !== 0) {
    return countSolutions(board, limit, position + 1, count);
  }

  for (let value = 1; value <= 9; value += 1) {
    if (isSafe(board, row, column, value)) {
      board[row][column] = value;
      count = countSolutions(board, limit, position + 1, count);
      board[row][column] = 0;
      if (count >= limit) {
        return count;
      }
    }
  }
  return count;
}

function createPuzzle(clueCount) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const solved = createSolvedBoard();
    const puzzle = solved.map((row) => [...row]);
    const positions = shuffledPositions();
    let remainingClues = 81;

    for (const position of positions) {
      if (remainingClues <= clueCount) {
        break;
      }
      const row = Math.floor(position / 9);
      const column = position % 9;
      const value = puzzle[row][column];
      puzzle[row][column] = 0;
      if (countSolutions(puzzle) === 1) {
        remainingClues -= 1;
      } else {
        puzzle[row][column] = value;
      }
    }

    if (remainingClues === clueCount) {
      return { puzzle, solution: solved };
    }
  }

  throw new Error("Unable to generate a unique Sudoku puzzle.");
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function updateTimer() {
  const currentElapsed = gameCompleted
    ? elapsedSeconds
    : elapsedSeconds + Math.floor((Date.now() - gameStartedAt) / 1000);
  timerDisplay.textContent = `Time: ${formatTime(currentElapsed)}`;
}

function startTimer() {
  clearInterval(timerInterval);
  gameStartedAt = Date.now();
  timerInterval = setInterval(() => {
    updateTimer();
    saveGame();
  }, 1000);
  updateTimer();
}

function stopTimer() {
  elapsedSeconds += Math.floor((Date.now() - gameStartedAt) / 1000);
  gameCompleted = true;
  clearInterval(timerInterval);
  updateTimer();
}

function startNewGame() {
  elapsedSeconds = 0;
  gameCompleted = false;
  hintsUsed = 0;
  const clueCount = clueCounts[difficultySelect.value];
  const { puzzle, solution: solved } = createPuzzle(clueCount);
  solution = solved;

  cells.forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const column = index % 9;
    const isClue = puzzle[row][column] !== 0;
    cell.value = isClue ? puzzle[row][column] : "";
    cell.readOnly = isClue;
    cell.classList.toggle("given", isClue);
    cell.classList.remove("invalid", "hint");
    cell.dataset.notes = "";
    cell.parentElement.querySelector(".cell-notes")?.remove();
    cell.setAttribute("aria-invalid", "false");
    cell.setAttribute(
      "aria-label",
      `Row ${row + 1}, column ${column + 1}${isClue ? ", given" : ""}`
    );
  });

  status.textContent = `${difficultySelect.value} puzzle ready.`;
  startTimer();
  saveGame();
}

function saveGame() {
  const game = {
    difficulty: difficultySelect.value,
    solution,
    values: cells.map((cell) => cell.value),
    given: cells.map((cell) => cell.readOnly),
    hinted: cells.map((cell) => cell.classList.contains("hint")),
    hintsUsed,
    notes: cells.map((cell) => cell.dataset.notes || ""),
    elapsedSeconds: gameCompleted
      ? elapsedSeconds
      : elapsedSeconds + Math.floor((Date.now() - gameStartedAt) / 1000),
    gameCompleted,
  };
  localStorage.setItem(storageKey, JSON.stringify(game));
}

function readLeaderboard() {
  try {
    const saved = JSON.parse(localStorage.getItem(leaderboardKey) || "[]");
    return Array.isArray(saved)
      ? saved.filter((entry) =>
        entry &&
        typeof entry.name === "string" &&
        Number.isFinite(entry.time) &&
        typeof entry.difficulty === "string"
      ).map((entry) => ({
        ...entry,
        hints: Number.isInteger(entry.hints) && entry.hints >= 0
          ? entry.hints
          : 0,
      }))
      : [];
  } catch {
    localStorage.removeItem(leaderboardKey);
    return [];
  }
}

function renderLeaderboard() {
  const leaderboard = readLeaderboard();
  leaderboardBody.replaceChildren();
  leaderboard.forEach((entry, index) => {
    const row = document.createElement("tr");
    [
      index + 1,
      entry.name,
      formatTime(entry.time),
      entry.difficulty,
      entry.hints,
    ]
      .forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });
    leaderboardBody.append(row);
  });
}

function saveLeaderboardEntry() {
  const leaderboard = readLeaderboard();
  const name = playerNameInput.value.trim() || "Anonymous";
  const time = elapsedSeconds;
  leaderboard.push({
    name,
    time,
    difficulty: difficultySelect.value,
    hints: hintsUsed,
  });
  leaderboard.sort((first, second) => first.time - second.time);
  localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard.slice(0, 10)));
  renderLeaderboard();
}

function restoreGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (
      !saved ||
      !Array.isArray(saved.solution) ||
      saved.solution.length !== 9 ||
      saved.solution.some((row) =>
        !Array.isArray(row) ||
        row.length !== 9 ||
        row.some((value) => !Number.isInteger(value) || value < 1 || value > 9)
      ) ||
      !Array.isArray(saved.values) ||
      saved.values.length !== 81 ||
      !Array.isArray(saved.given) ||
      saved.given.length !== 81 ||
      saved.given.some((value) => typeof value !== "boolean") ||
      saved.values.some((value) => typeof value !== "string" || !/^[1-9]?$/.test(value))
    ) {
      return false;
    }

    solution = saved.solution;
    elapsedSeconds = Number.isFinite(saved.elapsedSeconds)
      ? saved.elapsedSeconds
      : 0;
    gameCompleted = saved.gameCompleted === true;
    hintsUsed = Number.isInteger(saved.hintsUsed) && saved.hintsUsed >= 0
      ? saved.hintsUsed
      : 0;
    const hinted = Array.isArray(saved.hinted) && saved.hinted.length === 81
      ? saved.hinted
      : Array(81).fill(false);
    const notes = Array.isArray(saved.notes) && saved.notes.length === 81
      ? saved.notes
      : Array(81).fill("");
    if (!Number.isInteger(saved.hintsUsed) || saved.hintsUsed < 0) {
      hintsUsed = hinted.filter(Boolean).length;
    }
    difficultySelect.value = clueCounts[saved.difficulty]
      ? saved.difficulty
      : "easy";
    cells.forEach((cell, index) => {
      const row = Math.floor(index / 9);
      const column = index % 9;
      const isClue = saved.given[index] === true;
      cell.value = typeof saved.values[index] === "string"
        ? saved.values[index]
        : "";
      cell.readOnly = isClue;
      cell.classList.toggle("given", isClue);
      cell.classList.remove("invalid", "hint");
      cell.classList.toggle("hint", hinted[index] === true);
      cell.dataset.notes = notes[index];
      renderNotes(cell);
      cell.setAttribute("aria-invalid", "false");
      cell.setAttribute(
        "aria-label",
        `Row ${row + 1}, column ${column + 1}${
          hinted[index] ? ", hint" : isClue ? ", given" : ""
        }`
      );
    });
    status.textContent = "Saved game restored.";
    if (gameCompleted) {
      updateTimer();
    } else {
      startTimer();
    }
    return true;
  } catch {
    localStorage.removeItem(storageKey);
    return false;
  }
}

function validateMove(cell, announce = true) {
  if (cell.readOnly || !cell.value) {
    cell.classList.remove("invalid");
    return true;
  }

  const index = cells.indexOf(cell);
  const row = Math.floor(index / 9);
  const column = index % 9;
  const valid = Number(cell.value) === solution[row][column];
  cell.classList.toggle("invalid", !valid);
  cell.setAttribute("aria-invalid", String(!valid));
  if (announce) {
    status.textContent = valid
      ? "Good move."
      : "That number is not correct for this cell.";
  }
  return valid;
}

function renderNotes(cell) {
  cell.parentElement.querySelector(".cell-notes")?.remove();
  if (!cell.dataset.notes) {
    return;
  }
  const notes = document.createElement("span");
  notes.className = "cell-notes";
  notes.textContent = `Notes: ${cell.dataset.notes}`;
  notes.setAttribute("aria-label", `Possible numbers: ${cell.dataset.notes}`);
  cell.parentElement.append(notes);
}

function updateNumberStatus(number) {
  const matching = cells.filter((cell) => cell.value === String(number)).length;
  numberStatus.textContent = `${matching} ${number}${matching === 1 ? "" : "s"} placed.`;
  cells.forEach((cell) => {
    cell.classList.toggle("number-match", cell.value === String(number));
  });
}

cells.forEach((cell) => {
  cell.addEventListener("input", () => {
    cell.value = cell.value.replace(/[^1-9]/g, "").slice(0, 1);
    cell.classList.remove("hint");
    validateMove(cell);
    updateNumberStatus(cell.value);
    saveGame();
  });
});

difficultySelect.addEventListener("change", startNewGame);
newGameButton.addEventListener("click", startNewGame);
hintButton.addEventListener("click", () => {
  const emptyCells = cells.filter((cell) => !cell.readOnly && !cell.value);
  if (!emptyCells.length) {
    status.textContent = "There are no empty cells that need a hint.";
    return;
  }

  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const index = cells.indexOf(cell);
  const row = Math.floor(index / 9);
  const column = index % 9;
  cell.value = solution[row][column];
  cell.classList.remove("invalid");
  cell.setAttribute("aria-invalid", "false");
  cell.classList.add("hint");
  cell.readOnly = true;
  cell.setAttribute(
    "aria-label",
    `Row ${row + 1}, column ${column + 1}, hint`
  );
  hintsUsed += 1;
  status.textContent = "Hint added.";
  saveGame();
});

noteModeButton.addEventListener("click", () => {
  noteMode = !noteMode;
  noteModeButton.setAttribute("aria-pressed", String(noteMode));
  noteModeButton.textContent = `Note mode: ${noteMode ? "On" : "Off"}`;
  status.textContent = noteMode
    ? "Note mode enabled. Select a cell, then choose a number."
    : "Note mode disabled.";
});

numberPalette.addEventListener("click", (event) => {
  const button = event.target.closest("[data-number]");
  if (!button) {
    return;
  }
  const number = button.dataset.number;
  const selectedCell = document.activeElement;
  if (noteMode && selectedCell?.matches("table input") && !selectedCell.readOnly) {
    const notes = new Set(selectedCell.dataset.notes || "");
    if (notes.has(number)) {
      notes.delete(number);
    } else {
      notes.add(number);
    }
    selectedCell.dataset.notes = [...notes].sort().join("");
    renderNotes(selectedCell);
    saveGame();
    return;
  }
  updateNumberStatus(number);
});

solverAnimationButton.addEventListener("click", () => {
  if (solverRunning) {
    return;
  }
  solverRunning = true;
  solverAnimationButton.disabled = true;
  status.textContent = "Showing solver steps.";
  const emptyCells = cells.filter((cell) => !cell.readOnly);
  emptyCells.forEach((cell, index) => {
    cell.style.animationDelay = `${index * 80}ms`;
    cell.classList.add("solver-step");
  });
  window.setTimeout(() => {
    emptyCells.forEach((cell) => {
      cell.classList.remove("solver-step");
      cell.style.animationDelay = "";
    });
    status.textContent = "Solver steps complete. No values were changed.";
    solverRunning = false;
    solverAnimationButton.disabled = false;
  }, emptyCells.length * 80 + 700);
});
checkSolutionButton.addEventListener("click", () => {
  const complete = cells.every((cell) => /^[1-9]$/.test(cell.value));
  const correct = complete && cells.every((cell, index) => {
    const row = Math.floor(index / 9);
    const column = index % 9;
    return Number(cell.value) === solution[row][column];
  });
  status.textContent = correct
    ? "Congratulations! You solved the puzzle."
    : "The puzzle is not complete or has incorrect numbers.";
  cells.forEach((cell) => validateMove(cell, false));
  if (correct && !gameCompleted) {
    stopTimer();
    saveLeaderboardEntry();
  }
  saveGame();
});

renderLeaderboard();
window.addEventListener("beforeunload", saveGame);
if (!restoreGame()) {
  startNewGame();
}
