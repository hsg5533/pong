/**
 * 공이 targetX까지 이동할 때의 y좌표를 시뮬레이션으로 예측
 */
export function predictBallY(
  startX,
  startY,
  speedX,
  speedY,
  radius,
  targetX,
  canvasHeight
) {
  let simX = startX;
  let simY = startY;
  let simVX = speedX;
  let simVY = speedY;

  const movingRight = simVX > 0;
  const notReachedTarget = () =>
    movingRight ? simX + radius < targetX : simX - radius > targetX;

  let loopCount = 0;
  const maxLoop = 2000;

  while (loopCount < maxLoop && notReachedTarget()) {
    loopCount++;
    simX += simVX;
    simY += simVY;
    // 상/하 벽 충돌
    if (simY - radius < 0) {
      simY = radius;
      simVY = -simVY;
    } else if (simY + radius > canvasHeight) {
      simY = canvasHeight - radius;
      simVY = -simVY;
    }
  }

  return simY;
}

/**
 * 일정 프레임(reactionFrames)만큼 대기한 후,
 * 목표 위치에 약간의 오차(randomOffsetRange)를 두고 이동
 */
export class PaddleAI {
  constructor({ reactionFrames, randomOffsetRange, paddleSpeed }) {
    this.reactionFrames = reactionFrames;
    this.randomOffsetRange = randomOffsetRange;
    this.paddleSpeed = paddleSpeed;
    this.currentTimer = 0;
    this.active = false; // 공이 내 쪽으로 오는 중인지
  }

  updateState(ballGoingMyWay) {
    if (ballGoingMyWay) {
      // 공이 AI 쪽으로 오는 중이면 타이머 증가
      this.currentTimer++;
      this.active = this.currentTimer >= this.reactionFrames;
    } else {
      // 공이 다른 쪽 -> 타이머 리셋
      this.currentTimer = 0;
      this.active = false;
    }
  }

  movePaddleToTarget(paddleY, paddleHeight, targetY, canvasHeight) {
    // 목표 위치에 “랜덤 오차” 추가
    if (this.randomOffsetRange > 0) {
      const offset =
        Math.random() * this.randomOffsetRange - this.randomOffsetRange / 2;
      targetY += offset;
    }

    // 실제 이동(단순 AI)
    const centerY = paddleY + paddleHeight / 2;
    if (centerY < targetY) {
      paddleY += this.paddleSpeed;
    } else if (centerY > targetY) {
      paddleY -= this.paddleSpeed;
    }

    // 범위 제한
    if (paddleY < 0) paddleY = 0;
    if (paddleY > canvasHeight - paddleHeight) {
      paddleY = canvasHeight - paddleHeight;
    }

    return paddleY;
  }
}
