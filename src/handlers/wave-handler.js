import { createWave, getWaveStatus, removeEnemy, isWaveComplete, progressToNextWave, validateEnemy, validateWave } from "../models/wave-model.js";
/* WaveChangeHandler 51 */
export const waveChangeHandler = (io, socket) => {
  const userId = socket.handshake.query.userId;

  // 웨이브 시작
  socket.on("waveStart", () => {
    const waveValidation = validateWave(userId);
    if (waveValidation.valid && waveValidation.isActive) {
      io.to(userId).emit("wave:error", { message: "이미 진행 중인 웨이브가 있습니다." });
      return;
    }
    // 웨이브 생성
    createWave(userId);
    io.to(userId).emit("wave:started");
  });

  // 몬스터 처치 확인
  socket.on("wave:enemyKilled", ({ enemyUniqueId }) => {
    // 몬스터 존재 여부 검증
    const enemyValidation = validateEnemy(userId, enemyUniqueId);
    if (!enemyValidation.valid) {
      io.to(userId).emit("wave:error", { message: enemyValidation.message });
      return;
    }

    // 웨이브 활성화 상태 검증
    if (!enemyValidation.isActive) {
      io.to(userId).emit("wave:error", { message: "현재 진행 중인 웨이브가 없습니다." });
      return;
    }

    const removedEnemy = removeEnemy(userId, enemyUniqueId);
    if (removedEnemy) {
      const waveStatus = getWaveStatus(userId);

      io.to(userId).emit("wave:status", {
        remainingMonsters: waveStatus.remainingMonsters,
        currentWave: waveStatus.currentWaveIndex + 1,
      });
    }
  });

  // 보스 처치 확인
  socket.on("wave:bossKilled", ({ bossUniqueId }) => {
    // 보스 존재 여부 검증
    const bossValidation = validateEnemy(userId, bossUniqueId);
    if (!bossValidation.valid) {
      io.to(userId).emit("wave:error", { message: bossValidation.message });
      return;
    }

    // 보스 타입 검증
    if (bossValidation.type !== "boss") {
      io.to(userId).emit("wave:error", { message: "해당 몬스터는 보스가 아닙니다." });
      return;
    }

    const removedBoss = removeEnemy(userId, bossUniqueId);
    if (removedBoss && isWaveComplete(userId)) {
      const waveStatus = getWaveStatus(userId);

      if (progressToNextWave(userId)) {
        io.to(userId).emit("wave:nextWave");
      } else {
        io.to(userId).emit("wave:allComplete", {});
      }
    }
  });

  // 현재 웨이브 상태 요청
  socket.on("wave:getStatus", () => {
    const waveValidation = validateWave(userId);
    if (!waveValidation.valid) {
      io.to(userId).emit("wave:error", { message: waveValidation.message });
      return;
    }

    const status = getWaveStatus(userId);
    if (status) {
      io.to(userId).emit("wave:status", {
        currentWave: status.currentWaveIndex + 1,
        remainingMonsters: status.remainingMonsters,
        isActive: status.isActive,
        bossSpawned: status.bossSpawned,
      });
    }
  });

  // 웨이브 재시작 요청
  socket.on("wave:restart", () => {
    const waveValidation = validateWave(userId);
    if (waveValidation.valid && waveValidation.isActive) {
      io.to(userId).emit("wave:error", { message: "이미 진행 중인 웨이브가 있습니다." });
      return;
    }

    createWave(userId);
    io.to(userId).emit("wave:started");
  });
};
