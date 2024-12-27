import { getGameAssets } from "../inits/assets.js";
import { createWave, getWave, startWave, validateWave, progressToNextWave } from "../models/wave-model.js";
import { createAliveMonsters } from "../models/monster-model.js";
import { setGold } from "../models/gold-model.js";
import { START_MONEY } from "../constants.js";

/** 웨이브 시작 처리 */
export const waveStartHandler = (userId, payload) => {
  try {
    const { waves } = getGameAssets();
    const { timestamp } = payload;

    // 1. 웨이브 진행 가능 상태 체크
    const waveValidation = validateWave(userId);
    if (waveValidation.valid && waveValidation.isActive) {
      return { status: "fail", message: "이미 진행 중인 웨이브가 있습니다." };
    }

    // 2. 웨이브 정보 조회 및 생성
    const wave = getWave(userId);
    const currentWaveIndex = wave ? wave.currentWaveIndex : 0;
    const currentWaveData = waves.data[currentWaveIndex];

    if (!wave) {
      createWave(userId);
      createAliveMonsters(userId);
      setGold(userId, START_MONEY, START_MONEY, "START", timestamp);
    }

    // 3. 웨이브 시작 처리
    startWave(userId, currentWaveData);

    return {
      status: "success",
      waveNumber: currentWaveIndex + 1, // 웨이브 번호
      monsterCount: currentWaveData.monster_cnt, // 몬스터 수
      monsterId: currentWaveData.monster_id, // 몬스터 아이디
      bossId: currentWaveData.boss_id, // 보스 아이디
      timestamp: timestamp, // 타임스탬프
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

    // 2. 현재 웨이브 상태 체크
    const wave = getWave(userId);
    if (!wave.isActive) {
      return { status: "fail", message: "현재 진행 중인 웨이브가 없습니다." };
    }

    // 3. 남은 몬스터 체크
    if (wave.remainingMonsters > 0) {
      return {
        status: "fail",
        message: `아직 처치해야 할 몬스터가 ${wave.remainingMonsters}마리 남아있습니다.`,
      };
    }

    // 4. 다음 웨이브 진행
    if (progressToNextWave(userId, timestamp)) {
      return {
        status: "success",
        waveNumber: wave.currentWaveIndex + 2, // 다음 웨이브 번호
        timestamp: timestamp, // 타임스탬프
      };
    } else {
      return {
        status: "success",
        type: "allComplete", // 모든 몬스터 처치 완료
        timestamp: timestamp, // 타임스탬프
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
      currentWave: wave.currentWaveIndex + 1, // 현재 웨이브 번호
      isActive: wave.isActive, // 웨이브 진행 여부
      remainingMonsters: wave.remainingMonsters, // 남은 몬스터 수
    };
  } catch (error) {
    throw new Error("Failed to getWaveStatusHandler !! " + error.message);
  }
};

/** 웨이브 이벤트 핸들러 */
export const waveChangeHandler = (io, socket) => {
  const userId = socket.handshake.query.userId;

  try {
    // 웨이브 시작
    socket.on("waveStart", (payload) => {
      try {
        const result = waveStartHandler(userId, payload);
        if (result.status === "fail") {
          io.to(userId).emit("wave:error", { message: result.message });
          return;
        }
        io.to(userId).emit("wave:started", result);
      } catch (error) {
        io.to(userId).emit("wave:error", { message: error.message });
      }
    });

    // 다음 웨이브로 진행
    socket.on("wave:next", (payload) => {
      try {
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
      } catch (error) {
        io.to(userId).emit("wave:error", { message: error.message });
      }
    });

    // 웨이브 상태 조회
    socket.on("wave:getStatus", () => {
      try {
        const result = getWaveStatusHandler(userId);
        if (result.status === "fail") {
          io.to(userId).emit("wave:error", { message: result.message });
          return;
        }
        io.to(userId).emit("wave:status", result);
      } catch (error) {
        io.to(userId).emit("wave:error", { message: error.message });
      }
    });

    // 몬스터 처치 이벤트
    socket.on("monster:killed", (payload) => {
      try {
        const wave = getWave(userId);
        if (!wave || !wave.isActive) {
          io.to(userId).emit("wave:error", { message: "진행 중인 웨이브가 없습니다." });
          return;
        }

        wave.remainingMonsters--;

        if (wave.remainingMonsters <= 0) {
          const result = nextWaveHandler(userId, { timestamp: payload.timestamp });
          if (result.status === "fail") {
            io.to(userId).emit("wave:error", { message: result.message });
            return;
          }

          if (result.type === "allComplete") {
            io.to(userId).emit("wave:allComplete", { timestamp: result.timestamp });
          } else {
            io.to(userId).emit("wave:next", result);
          }
        }

        io.to(userId).emit("wave:status", {
          status: "success",
          currentWave: wave.currentWaveIndex + 1, // 현재 웨이브 번호
          isActive: wave.isActive, // 웨이브 진행 여부
          remainingMonsters: wave.remainingMonsters, // 남은 몬스터 수
        });
      } catch (error) {
        io.to(userId).emit("wave:error", { message: error.message });
      }
    });
  } catch (error) {
    io.to(userId).emit("wave:error", { message: "Server error occurred" });
  }
};
