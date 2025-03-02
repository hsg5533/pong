import {
  initGame,
  setGameState,
  GAME_STATES,
  startGameLoop,
  resetScores,
} from "./game.js";

const menuPanel = document.getElementById("menuPanel");
const startButton = document.getElementById("startButton");
const difficultySelect = document.getElementById("difficultySelect");
const autoPlayLeftCheck = document.getElementById("autoPlayLeftCheck");

const gameCanvas = document.getElementById("gameCanvas");
const gameOverPanel = document.getElementById("gameOverPanel");

const restartButton = document.getElementById("restartButton");

// 1) 초기 세팅: 게임 초기화 (STATE: MENU)
initGame(gameCanvas);

// 2) [메뉴] Start Game 버튼 이벤트
startButton.addEventListener("click", () => {
  // 난이도 선택값
  const difficulty = difficultySelect.value; // 'easy'|'normal'|'hard'
  const autoLeft = autoPlayLeftCheck.checked;
  // 점수 등 리셋
  resetScores();
  // 게임 시작 상태로 전환
  setGameState(GAME_STATES.PLAYING, { difficulty, autoLeft });
  menuPanel.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
});

// 3) [게임오버] Restart 버튼 이벤트
restartButton.addEventListener("click", () => {
  menuPanel.classList.remove("hidden");
  gameOverPanel.classList.add("hidden");
  setGameState(GAME_STATES.MENU);
});

// 게임 루프 시작
startGameLoop();
