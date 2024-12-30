import { waveModel, WaveState } from "../models/wave-model.js";
import { createAliveMonsters, getMonsterInstance, getBossInstance } from "../models/monster-model.js";

export const waveChangeHandler = {
  /*
   * 웨이브 시작 요청 처리
   * - 새로운 유저인 경우 초기 웨이브 데이터 생성
   * - 이미 진행 중인 웨이브가 있는지 확인
   * - 웨이브 시작 시 몬스터 인스턴스 생성 및 상태 반환
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

      // 웨이브 시작 처리 (WAITING -> ACTIVE)
      if (waveModel.startWave(userId)) {
        const newStatus = waveModel.getWaveStatus(userId);
        const monsterInstance = getMonsterInstance(userId);

        return {
          status: "success",
          waveNumber: newStatus.waveNumber,
          monsterData: monsterInstance,
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
   * 일반 몬스터 처치 요청 처리
   * - 몬스터 처치 시 남은 몬스터 수 감소
   * - 모든 몬스터 처치 완료 시 보스 몬스터 등장
   * - 현재 상태 및 다음 몬스터 정보 반환
   */
  monsterKill: (userId, payload) => {
    try {
      const { timestamp } = payload;

      if (waveModel.handleMonsterKill(userId)) {
        const status = waveModel.getWaveStatus(userId);

        // 모든 몬스터 처치 완료시 보스 등장
        if (status.state === WaveState.BOSS) {
          const bossInstance = getBossInstance(userId);
          return {
            status: "success",
            type: "BOSS_SPAWN",
            bossData: bossInstance,
            timestamp,
          };
        }

        return {
          status: "success",
          type: "STATUS_UPDATE",
          status: {
            ...status,
            currentMonster: getMonsterInstance(userId),
          },
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
   * 보스 몬스터 처치 요청 처리
   * - 보스 처치 성공 시 웨이브 완료 처리
   * - 다음 웨이브 존재 시 다음 웨이브로 진행
   * - 모든 웨이브 완료 시 게임 종료
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
   * 현재 웨이브 상태 조회 요청 처리
   * - 웨이브 번호, 진행 상태, 남은 몬스터 수 등 반환
   * - 웨이브 데이터가 없는 경우 에러 메시지 반환
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
