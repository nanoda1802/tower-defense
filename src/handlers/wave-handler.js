import { getGameAssets } from "../inits/assets.js";
import { createWave, getWave, startWave, validateWave, progressToNextWave } from "../models/wave-model.js";

/** 웨이브 시작 처리 */
export const waveStartHandler = (userId, payload) => {
  try {
    const { wave: waveJson } = getGameAssets();
    const { timestamp } = payload;

    // 1. 웨이브 진행 가능 상태 체크
    const waveValidation = validateWave(userId);
    if (waveValidation.valid && waveValidation.isActive) {
      return { status: "fail", message: "이미 진행 중인 웨이브가 있습니다." };
    }

    // 2. 웨이브 정보 조회 및 생성
    const wave = getWave(userId);
    const currentWaveIndex = wave ? wave.currentWaveIndex : 0;
    const currentWaveData = waveJson.data[currentWaveIndex];

    if (!wave) {
      createWave(userId, timestamp);
    }

    // 3. 웨이브 시작 처리
    startWave(userId, currentWaveData, timestamp);

    return {
      status: "success",
      waveNumber: currentWaveIndex + 1,
      monsterCount: currentWaveData.monster_cnt,
      timestamp: timestamp,
    };
  } catch (error) {
    throw new Error("Failed to waveStartHandler !! " + error.message);
  }
};

/** 다음 웨이브로 진행 처리 */
export const nextWaveHandler = (userId, payload) => {
  try {
    const { timestamp } = payload;

    // 1. 웨이브 진행 가능 상태 체크
    const waveValidation = validateWave(userId);
    if (!waveValidation.valid) {
      return { status: "fail", message: waveValidation.message };
    }

    // 2. 다음 웨이브 진행 가능 여부 체크
    const wave = getWave(userId);
    if (!wave.isActive) {
      return { status: "fail", message: "현재 진행 중인 웨이브가 없습니다." };
    }

    // 3. 다음 웨이브 진행
    if (progressToNextWave(userId, timestamp)) {
      return {
        status: "success",
        waveNumber: wave.currentWaveIndex + 2, // 다음 웨이브 번호
        timestamp: timestamp,
      };
    } else {
      return {
        status: "success",
        type: "allComplete",
        timestamp: timestamp,
      };
    }
  } catch (error) {
    throw new Error("Failed to nextWaveHandler !! " + error.message);
  }
};

/** 웨이브 상태 조회 */
export const getWaveStatusHandler = (userId) => {
  try {
    // 1. 웨이브 상태 체크
    const waveValidation = validateWave(userId);
    if (!waveValidation.valid) {
      return { status: "fail", message: waveValidation.message };
    }

    // 2. 웨이브 정보 조회
    const wave = getWave(userId);
    return {
      status: "success",
      currentWave: wave.currentWaveIndex + 1,
      isActive: wave.isActive,
      remainingMonsters: wave.remainingMonsters,
    };
  } catch (error) {
    throw new Error("Failed to getWaveStatusHandler !! " + error.message);
  }
};

/** 웨이브 이벤트 핸들러 */
export const waveChangeHandler = (io, socket) => {
  const userId = socket.handshake.query.userId;

  // 웨이브 시작
  socket.on("waveStart", (payload) => {
    const result = waveStartHandler(userId, payload);
    if (result.status === "fail") {
      io.to(userId).emit("wave:error", { message: result.message });
      return;
    }
    io.to(userId).emit("wave:started", result);
  });

  // 다음 웨이브로 진행
  socket.on("wave:next", (payload) => {
    const result = nextWaveHandler(userId, payload);
    if (result.status === "fail") {
      io.to(userId).emit("wave:error", { message: result.message });
      return;
    }
    if (result.type === "allComplete") {
      io.to(userId).emit("wave:allComplete", { timestamp: result.timestamp });
    } else {
      io.to(userId).emit("wave:next", result);
    }
  });

  // 웨이브 상태 조회
  socket.on("wave:getStatus", () => {
    const result = getWaveStatusHandler(userId);
    if (result.status === "fail") {
      io.to(userId).emit("wave:error", { message: result.message });
      return;
    }
    io.to(userId).emit("wave:status", result);
  });
};
