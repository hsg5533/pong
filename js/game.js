import { predictBallY, PaddleAI } from "./ai.js";

// =====================
// 1) 상수, 상태 정의
// =====================
export const GAME_STATES = {
  MENU: "MENU",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
};

let currentState = GAME_STATES.MENU;

// 난이도별 설정값
const DIFFICULTY_SETTINGS = {
  easy: {
    reactionFrames: 30,
    offset: 60,
    ballSpeed: 4,
    aiPaddleSpeed: 4,
    targetScore: 5,
  },
  normal: {
    reactionFrames: 15,
    offset: 20,
    ballSpeed: 5,
    aiPaddleSpeed: 6,
    targetScore: 7,
  },
  hard: {
    reactionFrames: 5,
    offset: 5,
    ballSpeed: 6,
    aiPaddleSpeed: 8,
    targetScore: 10,
  },
};

// =====================
// 2) 게임 변수들
// =====================
let ctx;
let canvasWidth;
let canvasHeight;

// 패들
let leftPaddleY;
let rightPaddleY;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;

// 공
let ballX;
let ballY;
let ballSpeedX;
let ballSpeedY;
const BALL_RADIUS = 8;

// 점수
let leftScore = 0;
let rightScore = 0;

// AI 여부 (왼쪽)
let autoPlayLeft = false;

// AI 인스턴스 (왼/오)
let leftAI;
let rightAI;

// 이번 판의 목표 점수(난이도별)
let targetScore = 7;

// 사운드
const hitSound = new Audio("./sound/wood_plank_flicks.ogg");
// (URL은 예시, 필요에 따라 교체)

// =====================
// 3) 초기화
// =====================
export function initGame(canvasElement) {
  ctx = canvasElement.getContext("2d");
  canvasWidth = canvasElement.width;
  canvasHeight = canvasElement.height;

  setGameState(GAME_STATES.MENU);
}

// =====================
// 4) 게임 상태 변경
// =====================
export function setGameState(newState, payload = {}) {
  currentState = newState;

  if (newState === GAME_STATES.MENU) {
    // 메뉴로 돌아갈 때 처리 (필요 시)
  } else if (newState === GAME_STATES.PLAYING) {
    // 난이도, 왼쪽 AI 여부 가져오기
    const { difficulty, autoLeft } = payload;
    autoPlayLeft = autoLeft;

    // 난이도별 설정
    const diffSetting =
      DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
    const {
      reactionFrames,
      offset,
      ballSpeed,
      aiPaddleSpeed,
      targetScore: tScore,
    } = diffSetting;
    targetScore = tScore;

    // 패들 위치 리셋
    leftPaddleY = (canvasHeight - PADDLE_HEIGHT) / 2;
    rightPaddleY = (canvasHeight - PADDLE_HEIGHT) / 2;

    // 공 초기화
    ballX = canvasWidth / 2;
    ballY = canvasHeight / 2;
    ballSpeedX = Math.random() > 0.5 ? ballSpeed : -ballSpeed;
    ballSpeedY = Math.random() > 0.5 ? 3 : -3;

    // 점수 리셋은 main.js에서 resetScores()로 처리

    // AI 인스턴스 생성
    leftAI = new PaddleAI({
      reactionFrames: reactionFrames,
      randomOffsetRange: offset,
      paddleSpeed: aiPaddleSpeed,
    });
    rightAI = new PaddleAI({
      reactionFrames: reactionFrames,
      randomOffsetRange: offset / 2, // 오른쪽은 좀 더 정확하게
      paddleSpeed: aiPaddleSpeed,
    });
  } else if (newState === GAME_STATES.GAME_OVER) {
    // 승패 확정 → main.js 측에서 패널을 보여줌
  }
}

// 점수 리셋
export function resetScores() {
  leftScore = 0;
  rightScore = 0;
}

// =====================
// 5) 게임 루프 시작
// =====================
let rafId;
export function startGameLoop() {
  const loop = () => {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  };
  loop();
}

// =====================
// 6) 업데이트 로직
// =====================
function update() {
  if (currentState !== GAME_STATES.PLAYING) return;

  // 왼쪽 패들
  if (autoPlayLeft) {
    // AI
    const goingLeft = ballSpeedX < 0;
    leftAI.updateState(goingLeft);
    if (leftAI.active) {
      // 공이 내 쪽 → 궤적 예측
      const predictedY = predictBallY(
        ballX,
        ballY,
        ballSpeedX,
        ballSpeedY,
        BALL_RADIUS,
        PADDLE_WIDTH,
        canvasHeight
      );
      leftPaddleY = leftAI.movePaddleToTarget(
        leftPaddleY,
        PADDLE_HEIGHT,
        predictedY,
        canvasHeight
      );
    } else {
      // 중앙에서 대기
      const centerY = canvasHeight / 2;
      leftPaddleY = leftAI.movePaddleToTarget(
        leftPaddleY,
        PADDLE_HEIGHT,
        centerY,
        canvasHeight
      );
    }
  } else {
    // 수동 조작 (키 입력)
    handleManualInput();
  }

  // 오른쪽 패들 (항상 AI)
  const goingRight = ballSpeedX > 0;
  rightAI.updateState(goingRight);
  if (rightAI.active) {
    const predictedY = predictBallY(
      ballX,
      ballY,
      ballSpeedX,
      ballSpeedY,
      BALL_RADIUS,
      canvasWidth - PADDLE_WIDTH,
      canvasHeight
    );
    rightPaddleY = rightAI.movePaddleToTarget(
      rightPaddleY,
      PADDLE_HEIGHT,
      predictedY,
      canvasHeight
    );
  } else {
    const centerY = canvasHeight / 2;
    rightPaddleY = rightAI.movePaddleToTarget(
      rightPaddleY,
      PADDLE_HEIGHT,
      centerY,
      canvasHeight
    );
  }

  // 공 이동
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // 상/하 벽 충돌
  if (ballY - BALL_RADIUS < 0) {
    ballY = BALL_RADIUS;
    ballSpeedY = -ballSpeedY;
    playHitSound();
  } else if (ballY + BALL_RADIUS > canvasHeight) {
    ballY = canvasHeight - BALL_RADIUS;
    ballSpeedY = -ballSpeedY;
    playHitSound();
  }

  // 왼쪽 패들 충돌
  if (
    ballX - BALL_RADIUS < PADDLE_WIDTH &&
    ballY > leftPaddleY &&
    ballY < leftPaddleY + PADDLE_HEIGHT
  ) {
    ballX = PADDLE_WIDTH + BALL_RADIUS; // 살짝 튕겨남
    ballSpeedX = -ballSpeedX;
    const hitPos = ballY - (leftPaddleY + PADDLE_HEIGHT / 2);
    ballSpeedY = hitPos * 0.2;
    playHitSound();
  }

  // 오른쪽 패들 충돌
  if (
    ballX + BALL_RADIUS > canvasWidth - PADDLE_WIDTH &&
    ballY > rightPaddleY &&
    ballY < rightPaddleY + PADDLE_HEIGHT
  ) {
    ballX = canvasWidth - PADDLE_WIDTH - BALL_RADIUS;
    ballSpeedX = -ballSpeedX;
    const hitPos = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
    ballSpeedY = hitPos * 0.2;
    playHitSound();
  }

  // 골 아웃
  if (ballX - BALL_RADIUS < 0) {
    // 오른쪽 득점
    rightScore++;
    checkScore();
    resetBallPositions();
  } else if (ballX + BALL_RADIUS > canvasWidth) {
    // 왼쪽 득점
    leftScore++;
    checkScore();
    resetBallPositions();
  }
}

function checkScore() {
  if (leftScore >= targetScore || rightScore >= targetScore) {
    setGameState(GAME_STATES.GAME_OVER);
    // DOM에서 "Game Over" 패널 표시
    const gameOverPanel = document.getElementById("gameOverPanel");
    const gameOverTitle = document.getElementById("gameOverTitle");
    gameOverPanel.classList.remove("hidden");
    if (leftScore > rightScore) {
      gameOverTitle.textContent = "Game Over: Left Wins!";
    } else {
      gameOverTitle.textContent = "Game Over: Right Wins!";
    }
  }
}

/**
 * 패들과 공을 중앙 위치로 다시 세팅 (점수 발생 후)
 */
function resetBallPositions() {
  ballX = canvasWidth / 2;
  ballY = canvasHeight / 2;
  // 속도는 그대로 유지하거나, 살짝 변경 가능
  ballSpeedX = -ballSpeedX; // 반대 방향
  ballSpeedY = Math.random() > 0.5 ? 3 : -3;

  leftPaddleY = (canvasHeight - PADDLE_HEIGHT) / 2;
  rightPaddleY = (canvasHeight - PADDLE_HEIGHT) / 2;
}

/**
 * 수동(키보드) 입력 처리
 */
let upPressed = false;
let downPressed = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") upPressed = true;
  if (e.key === "ArrowDown") downPressed = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") upPressed = false;
  if (e.key === "ArrowDown") downPressed = false;
});
function handleManualInput() {
  if (upPressed && leftPaddleY > 0) {
    leftPaddleY -= 6;
  } else if (downPressed && leftPaddleY < canvasHeight - PADDLE_HEIGHT) {
    leftPaddleY += 6;
  }
}

// 사운드 재생
function playHitSound() {
  // hitSound.currentTime = 0; // 짧은 사운드일 경우 매번 재생하려면 재설정
  hitSound.play().catch(() => {});
}

// =====================
// 7) 그리기 (네온 스타일)
// =====================
function draw() {
  // MENU 또는 GAME_OVER 상태에서도 배경은 그려주지만
  // 실제 공/패들 업데이트는 안 하도록 했습니다.

  // 배경 지우기
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 중앙 점선
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#0ff";
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(canvasWidth / 2, 0);
  ctx.lineTo(canvasWidth / 2, canvasHeight);
  ctx.stroke();
  ctx.setLineDash([]);

  // 왼쪽 패들 (녹색 네온)
  ctx.fillStyle = "#0f0";
  ctx.shadowColor = "#0f0";
  ctx.shadowBlur = 20;
  ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // 오른쪽 패들 (핑크 네온)
  ctx.fillStyle = "#f0f";
  ctx.shadowColor = "#f0f";
  ctx.shadowBlur = 20;
  ctx.fillRect(
    canvasWidth - PADDLE_WIDTH,
    rightPaddleY,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  // 공
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // 점수 표시
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "#0ff";
  ctx.textAlign = "center";
  ctx.fillText(leftScore, canvasWidth * 0.25, 50);
  ctx.fillText(rightScore, canvasWidth * 0.75, 50);
}
