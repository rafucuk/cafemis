<template>
	<MkSpacer :contentMax="800">
	  <div :class="$style.root">
		<div class="_gaps_s">
		  <div class="_woodenFrame">
			<div class="_woodenFrameInner">
			  <div style="display: flex; justify-content: space-between; align-items: center">
				<span>{{ i18n.ts.sudoku }}</span>
				<div>
				  <MkButton inline @click="newGame">{{ i18n.ts.newGame }}</MkButton>
				  <MkButton inline primary @click="checkSolution">{{ i18n.ts.check }}</MkButton>
				</div>
			  </div>
			</div>
		  </div>
  
		  <!-- Score and Timer Display -->
		  <div class="_woodenFrame">
			<div class="_woodenFrameInner">
			  <div :class="$style.statsContainer">
				<div :class="$style.stat">
				  <span>Score: {{ score }}</span>
				  <span :class="[$style.combo, wrongMove ? $style.penaltyFlash : '']">
					Combo: x{{ combo }}
				  </span>
				</div>
				<div :class="$style.stat">
				  <span>Time: {{ formatTime(timer) }}</span>
				</div>
			  </div>
			</div>
		  </div>
  
		  <div class="_woodenFrame">
			<div class="_woodenFrameInner">
			  <div :class="$style.gridContainer">
				<div v-for="(row, rowIndex) in board" :key="rowIndex" :class="$style.row">
				  <div
					v-for="(cell, colIndex) in row"
					:key="colIndex"
					:class="[
					  $style.cell,
					  selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? $style.selected : '',
					  cell.preset ? $style.preset : '',
					  cell.value && !isValid(cell.value, rowIndex, colIndex) ? $style.invalid : '',
					  cell.lastPlayed ? $style.lastPlayed : '',
					  cell.lastPlayed && !isValid(cell.value, rowIndex, colIndex) ? $style.wrongMove : ''
					]"
					@click="selectCell(rowIndex, colIndex)"
				  >
					{{ cell.value || '' }}
					<div v-if="showHints" :class="$style.pencilMarks">
					  <span v-for="n in getPencilMarks(rowIndex, colIndex)" :key="n">{{ n }}</span>
					</div>
				  </div>
				</div>
			  </div>
			</div>
		  </div>
  
		  <div class="_woodenFrame">
			<div class="_woodenFrameInner">
			  <div :class="$style.numberPad">
				<button
				  v-for="n in 9"
				  :key="n"
				  @click="inputNumber(n)"
				  :disabled="!selectedCell || selectedCell.preset"
				>
				  {{ n }}
				</button>
				<button @click="inputNumber(null)">✕</button>
			  </div>
			</div>
		  </div>
  
		  <div class="_woodenFrame">
			<div class="_woodenFrameInner">
			  <div style="text-align: center">
				<MkButton @click="toggleHints">{{ showHints ? i18n.ts.hideHints : i18n.ts.showHints }}</MkButton>
				<MkButton danger @click="solvePuzzle">{{ i18n.ts.solve }}</MkButton>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	</MkSpacer>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { i18n } from '@/i18n.js';
  import MkButton from '@/components/MkButton.vue';
  
  type Cell = {
	value: number | null;
	preset: boolean;
	lastPlayed?: boolean;
  };


  
  // Game state
  const board = ref<Cell[][]>(generatePuzzle());
  const selectedCell = ref<{ row: number; col: number; preset: boolean } | null>(null);
  const showHints = ref(false);
  const wrongMove = ref(false);
  
  // Scoring system constants
  const POINTS_PER_CORRECT = 100;
  const POINTS_PER_WRONG = 50;
  const COMBO_MULTIPLIER = 0.5;
  const TIME_PENALTY = 10;
  const COMBO_TIMEOUT = 5000;
  const MIN_COMBO = 1;
  const COMBO_PENALTY = 0.5;
  
  // Scoring state
  const score = ref(0);
  const combo = ref(1);
  const timer = ref(0);
  const timerInterval = ref<number | null>(null);
  const lastMoveTime = ref<number>(Date.now());
  
  function generatePuzzle(difficulty = 40) {
	const newBoard = Array(9).fill(null).map(() => 
	  Array(9).fill(null).map(() => ({ value: null, preset: false }))
	);
  
	for (let i = 0; i < 9; i += 3) {
	  fillBox(newBoard, i, i);
	}
  
	solveSudoku(newBoard);
  
	for (let i = 0; i < difficulty; i++) {
	  const row = Math.floor(Math.random() * 9);
	  const col = Math.floor(Math.random() * 9);
	  if (newBoard[row][col].value !== null) {
		newBoard[row][col] = { value: null, preset: false };
	  }
	}
  
	newBoard.forEach((row, i) => row.forEach((cell, j) => {
	  if (cell.value !== null) cell.preset = true;
	}));
  
	return newBoard;
  }
  
  function fillBox(board: Cell[][], row: number, col: number) {
	const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
	for (let i = 0; i < 3; i++) {
	  for (let j = 0; j < 3; j++) {
		board[row + i][col + j].value = nums.pop() || null;
	  }
	}
  }
  
  function startTimer() {
	timer.value = 0;
	timerInterval.value = window.setInterval(() => {
	  timer.value++;
	}, 1000);
  }
  
  function stopTimer() {
	if (timerInterval.value) {
	  clearInterval(timerInterval.value);
	  timerInterval.value = null;
	}
  }
  
  function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  function updateScore(isCorrect: boolean) {
	const currentTime = Date.now();
	const timeSinceLastMove = currentTime - lastMoveTime.value;
  
	if (isCorrect) {
	  // Calculate points with combo multiplier
	  const points = POINTS_PER_CORRECT * (1 + (combo.value - 1) * COMBO_MULTIPLIER);
	  score.value += Math.floor(points);
  
	  // Update combo based on timing
	  if (timeSinceLastMove < COMBO_TIMEOUT) {
		combo.value++;
	  } else {
		combo.value = MIN_COMBO;
	  }
	} else {
	  // Penalties for wrong moves
	  wrongMove.value = true;
	  setTimeout(() => { wrongMove.value = false; }, 1000);
  
	  // Decrease score
	  score.value = Math.max(0, score.value - POINTS_PER_WRONG);
	  
	  // Decrease combo but don't go below minimum
	  combo.value = Math.max(MIN_COMBO, Math.floor(combo.value * (1 - COMBO_PENALTY)));
	}
  
	lastMoveTime.value = currentTime;
  }
  
  function inputNumber(num: number | null) {
	if (!selectedCell.value || selectedCell.value.preset) return;
  
	board.value.forEach(row => row.forEach(cell => cell.lastPlayed = false));
  
	const { row, col } = selectedCell.value;
	const previousValue = board.value[row][col].value;
	board.value[row][col].value = num;
	board.value[row][col].lastPlayed = true;
  
	if (num !== null) {
	  const isCorrect = isValid(num, row, col);
	  updateScore(isCorrect);
	}
  }
  

  function selectCell(row: number, col: number) {
	if (board.value[row][col].preset) return;
	selectedCell.value = { row, col, preset: board.value[row][col].preset };
  }
  
  function getPencilMarks(row: number, col: number): number[] {
	if (board.value[row][col].value !== null) return [];
	const marks = [];
	for (let num = 1; num <= 9; num++) {
	  if (isValid(num, row, col)) marks.push(num);
	}
	return marks;
  }
    	// Move the isValid function declaration before any usage
	function isValid(num: number, row: number, col: number, boardRef: Cell[][] | null = null): boolean {
		const currentBoard = boardRef || board.value;
		
		// Check row
		for (let j = 0; j < 9; j++) {
			if (currentBoard[row][j].value === num && j !== col) return false;
		}

		// Check column
		for (let i = 0; i < 9; i++) {
			if (currentBoard[i][col].value === num && i !== row) return false;
		}

		// Check 3x3 box
		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;
		for (let i = boxRow; i < boxRow + 3; i++) {
			for (let j = boxCol; j < boxCol + 3; j++) {
			if (currentBoard[i][j].value === num && i !== row && j !== col) return false;
			}
		}

		return true;
	}

  function checkSolution() {
	const isValid = board.value.every((row, i) => 
	  row.every((cell, j) => 
		cell.value === null || isValid(cell.value, i, j)
	  )
	);
	
	if (isValid && findEmptyCell(board.value) === null) {
	  stopTimer();
	  const timeBonus = Math.max(0, 1000 - timer.value * TIME_PENALTY);
	  score.value += timeBonus;
	  alert(`${i18n.ts.congratulations}\nFinal Score: ${score.value}\nTime: ${formatTime(timer.value)}`);
	} else {
	  alert(i18n.ts.solutionIncorrect);
	}
  }
  
  function newGame() {
	board.value = generatePuzzle();
	selectedCell.value = null;
	score.value = 0;
	combo.value = 1;
	wrongMove.value = false;
	stopTimer();
	startTimer();
	lastMoveTime.value = Date.now();
  }
  
  function toggleHints() {
	showHints.value = !showHints.value;
  }
  
  function solvePuzzle() {
	const solvedBoard = JSON.parse(JSON.stringify(board.value));
	solveSudoku(solvedBoard);
	board.value = solvedBoard;
	stopTimer();
  }
  
  function findEmptyCell(board: Cell[][]): [number, number] | null {
	for (let i = 0; i < 9; i++) {
	  for (let j = 0; j < 9; j++) {
		if (board[i][j].value === null) return [i, j];
	  }
	}
	return null;
  }
  
  function solveSudoku(board: Cell[][]): boolean {
	const emptyCell = findEmptyCell(board);
	if (!emptyCell) return true;
  
	const [row, col] = emptyCell;
	for (let num = 1; num <= 9; num++) {
	  if (isValid(num, row, col, board)) {
		board[row][col].value = num;
		if (solveSudoku(board)) return true;
		board[row][col].value = null;
	  }
	}
	return false;
  }
  
  function shuffle(array: any[]) {
	return array.sort(() => Math.random() - 0.5);
  }
  
  onMounted(() => {
	startTimer();
  });
  
  onUnmounted(() => {
	stopTimer();
  });
  </script>
	
	<style lang="scss" module>
	.root {
	  max-width: 600px;
	  margin: 0 auto;
	}
	.statsContainer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
}

.stat {
  display: flex;
  gap: 16px;
  font-weight: bold;
}

.combo {
  color: var(--accent);
}

.lastPlayed {
  animation: highlight 1s ease-out;
}

@keyframes highlight {
  0% {
    background: var(--accent);
  }
  100% {
    background: var(--panel);
  }
}
	.gridContainer {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		gap: 1px;
		background: var(--divider, #ddd);
		border: 2px solid var(--divider, #ddd);
		max-width: 600px;
		margin: 0 auto;
	}
	
	.row {
	  display: contents;
	}
	
	.cell {
		box-sizing: border-box;
		aspect-ratio: 1;
		background: var(--panel, #fff);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		cursor: pointer;
		user-select: none;
		position: relative;
	}
	.cell:nth-child(3n) {
	border-right: 2px solid var(--divider, #ddd);
	}

	/* Horizontal thick borders */
	.row:nth-child(3n) .cell {
	border-bottom: 2px solid var(--divider, #ddd);
	}

	/* Remove redundant borders */
	.cell:nth-child(9n) {
	border-right: none;
	}

	.row:last-child .cell {
	border-bottom: none;
	}

	/* Optional states */
	.cell.selected {
	background: var(--accentedBg, #e0f0ff);
	}

	.cell.preset {
	background: var(--panelHighlight, #f5f5f5);
	}

	.cell.invalid {
	color: var(--error, #ff0000);
	}
	.pencilMarks {
	  position: absolute;
	  top: 0;
	  left: 0;
	  right: 0;
	  bottom: 0;
	  display: grid;
	  grid-template-columns: repeat(3, 1fr);
	  grid-template-rows: repeat(3, 1fr);
	  font-size: 0.6em;
	  padding: 2px;
	  color: var(--fgTransparentWeak);
	
	  span {
		display: flex;
		align-items: center;
		justify-content: center;
	  }
	}
	
	.numberPad {
	  display: grid;
	  grid-template-columns: repeat(5, 1fr);
	  gap: 8px;
	  padding: 8px;
	
	  button {
		aspect-ratio: 1;
		border: none;
		background: var(--panelHighlight);
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
	
		&:hover {
		  background: var(--panel);
		}
	
		&:disabled {
		  opacity: 0.5;
		  cursor: not-allowed;
		}
	  }
	}
	</style>