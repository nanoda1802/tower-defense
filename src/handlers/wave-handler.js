import { getGameAssets } from "../inits/assets.js";
import { rooms } from "../room/room.js";

/* 사용자의 웨이브 이동 처리 */
export const waveChangeHandler = (userId, payload) => {
  const {
    monsterIndex,
    currentWave,
    targetWave,
    timestamp: changeTime,
  } = payload;
  // [1] 서버에서 해당 유저의 room 가져오기
  const room = rooms.find((room) => {
    return room.userId === userId;
  });
  // [2] 사용자의 현재 기준 웨이브 정보 조회
  let userWaves = room.getWave();
  // [2-1] 웨이브 정보가 빈 배열이면, 즉 게임 진행 사항이 없는 사용자면 실패 응답
  if (!userWaves.length) {
    return { status: "fail", message: "진행 정보가 없는 사용자임다!!" };
  }
  // [3] 사용자가 지난 웨이브 목록 오름차순으로 정렬
  userWaves.sort((a, b) => a.waveId - b.waveId);
  // [3] 지난 웨이브 중 최근, 즉 배열의 마지막 웨이브 ID 값 가져옴
  const lastWaveId = userWaves.at(-1).waveId;
  // [4] 서버에 저장된 최근 웨이브 ID와, 클라이언트가 보낸 현재 웨이브 ID가 동일한지 비교
  if (lastWaveId !== currentWave) {
    // 다르다면 유효하지 않은 요청이므로 실패 응답
    return { status: "fail", message: "당신과 서버의 웨이브 정보가 다름다!!" };
  }
  // [5] 재료 데이터에서 웨이브 정보 가져옴
  const { waves } = getGameAssets();
  // [6] 목표 처치 수와 클라가 처치한 몬스터 수 비교해 더 적으면 실패 응답
  const killCount = waves.data.find(
    (wave) => wave.id === currentWave,
  ).monster_cnt;
  if (killCount > monsterIndex + 1) {
    return { status: "fail", message: "남은 몬스터가 있슴다!!" };
  }
  // [7] 클라이언트가 목표한 다음 웨이브 정보의 ID가 서버 재료 데이터에 없으면 실패 응답
  if (!waves.data.some((wave) => wave.id === targetWave)) {
    return { status: "fail", message: "넘어갈 웨이브가 없슴다!!" };
  }
  // [8] 모든 검증 통과 시 사용자의 웨이브를 다음으로 이동시키고, 이동 시간 기록
  room.setWave(targetWave, changeTime);
  // [11] 웨이브 이동 성공 응답 반환
  return { status: "success", message: "웨이브 이동 성공임다!!" };
};
