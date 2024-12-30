import { waveModel, WaveState } from "../models/wave-model.js";
import { createAliveMonsters } from "../models/monster-model.js";

export const waveChangeHandler = {
  /**
   * 웨이브 시작 처리
   * 1. 새로운 유저면 웨이브와 몬스터 초기화
   * 2. 이미 진행중인 웨이브가 있으면 에러 반환
   * 3. 웨이브 시작하고 상태 정보 반환
   */
  waveStart: (userId, payload) => {
    try {
      const { timestamp } = payload;
      const status = waveModel.getWaveStatus(userId);

      // 새로운 사용자인 경우 초기화
      if (!status) {
        waveModel.createWave(userId);
        createAliveMonsters(userId);
      }
      // 이미 ACTIVE나 BOSS 상태면 진행 불가
      else if (status.state === WaveState.ACTIVE || status.state === WaveState.BOSS) {
        return {
          status: "fail",
          message: "이미 진행 중인 웨이브가 있습니다.",
        };
      }

      // 웨이브 시작 처리 (IDLE -> ACTIVE)
      if (waveModel.startWave(userId)) {
        const newStatus = waveModel.getWaveStatus(userId);
        return {
          status: "success",
          waveNumber: newStatus.waveNumber,
          monsterData: newStatus.currentMonster,
          remainingMonsters: newStatus.remainingMonsters,
          timestamp,
        };
      }
    } catch (error) {
      return {
        status: "fail",
        message: error.message,
      };
    }
  },

  /**
   * 일반 몬스터 처치 처리
   * 1. 몬스터 처치 시 remainingMonsters 감소
   * 2. remainingMonsters가 0이 되면 보스 등장 (ACTIVE -> BOSS)
   * 3. 아직 남은 몬스터가 있으면 상태 업데이트
   */
  monsterKill: (userId, payload) => {
    try {
      const { timestamp } = payload;

      if (waveModel.handleMonsterKill(userId)) {
        const status = waveModel.getWaveStatus(userId);

        // 모든 몬스터 처치 완료시 보스 등장
        if (status.state === WaveState.BOSS) {
          return {
            status: "success",
            type: "BOSS_SPAWN",
            bossData: status.currentBoss,
            timestamp,
          };
        }

        return {
          status: "success",
          type: "STATUS_UPDATE",
          status,
          timestamp,
        };
      }
    } catch (error) {
      return {
        status: "fail",
        message: error.message,
      };
    }
  },

  /**
   * 보스 몬스터 처치 처리
   * 1. 보스 처치 시 웨이브 완료 (BOSS -> COMPLETE)
   * 2. 다음 웨이브로 진행 가능하면 다음 웨이브로 상태 변경
   * 3. 마지막 웨이브면 게임 완료
   */
  bossKill: (userId, payload) => {
    try {
      const { timestamp } = payload;

      if (waveModel.handleBossKill(userId)) {
        const status = waveModel.getWaveStatus(userId);

        // 다음 웨이브로 진행 가능한 경우
        if (waveModel.progressToNextWave(userId)) {
          return {
            status: "success",
            type: "NEXT_WAVE",
            waveNumber: status.waveNumber + 1,
            timestamp,
          };
        } else {
          // 모든 웨이브 클리어
          return {
            status: "success",
            type: "ALL_COMPLETE",
            timestamp,
          };
        }
      }
    } catch (error) {
      return {
        status: "fail",
        message: error.message,
      };
    }
  },

  /**
   * 현재 웨이브 상태 조회
   * - 웨이브 번호
   * - 현재 상태 (IDLE/ACTIVE/BOSS/COMPLETE)
   * - 현재 몬스터 정보
   * - 남은 몬스터 수
   */
  getWaveStatus: (userId) => {
    try {
      const status = waveModel.getWaveStatus(userId);
      if (!status) {
        return {
          status: "fail",
          message: "웨이브가 존재하지 않습니다.",
        };
      }
      return {
        status: "success",
        ...status,
      };
    } catch (error) {
      return {
        status: "fail",
        message: error.message,
      };
    }
  },
};
