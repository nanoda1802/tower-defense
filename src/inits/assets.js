import fs from "fs"; // node.js 기본 내장 모듈, File System
import path from "path"; // node.js 기본 내장 모듈, 파일 및 디렉토리 경로 다루는 함수들 제공
import { fileURLToPath } from "url"; // node.js 기본 내장 모듈, URL 파싱이나 조작, 변환 등의 작업 지원

/* 게임 재료 데이터들 저장하는 객체 */
let gameAssets = {};

/* 재료들 존재하는 폴더에 접근하기 위한 경로 설정 */
const __filename = fileURLToPath(import.meta.url); // 현재 작업 중인 모듈 파일의 위치 알려줌 (지금은 assets.js)
const __dirname = path.dirname(__filename); // __filename 통해 현 파일이 속한 폴더 알려줌
const basePath = path.join(__dirname, "../../assets"); // 재료들 있는 assets 폴더의 절대 경로 계산

/* 비동기적 파일 열람 */
const readFileAsync = (fileName) => {
  // [1] 비동기 작업 위한 프로미스 ON
  return new Promise((resolve, reject) => {
    // [2] 병렬 파일 읽기 시도, 성공 시 JSON 객체 형태의 데이터 반환
    // [2-1] path.join(폴더의 경로,그 폴더에서 읽을 파일)
    fs.readFile(path.join(basePath, fileName), "utf8", (err, data) => {
      // [2-2 a] 파일 열람 도중 문제 발생하면 콜백함수의 err 매개변수에 담겨서 reject
      // [2-2 b] 파일 열람 성공하면 콜백함수의 data 매개변수에 담겨서 JSON 객체로 변환된 후 resolve
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  });
};

/* 게임 재료 파일들 불러오기 */
export const loadGameAssets = async () => {
  try {
    // [1] 병렬적으로 파일 열람 후 각각 배열 구조분해할당
    const [bosses, monsters, pawnTowers, specialTowers] = await Promise.all([
      readFileAsync("boss.json"),
      readFileAsync("monster.json"),
      readFileAsync("pawn-tower.json"),
      readFileAsync("special-tower.json"),
      readFileAsync("wave.json")
    ]);
    // [2] 재료 데이터 저장하는 객체에 불러온 JSON 객체들 저장
    gameAssets = { bosses, monsters, pawnTowers, specialTowers, waves };
    // [3 a] 객체 통째로 반환
    return gameAssets;
  } catch (err) {
    // [3 b] 발생한 에러 관련 메세지 상위 스코프로 보냄
    throw new Error("!! Failed to load game assets !! " + err.message);
  }
};

/* 재료 데이터 조회 및 재사용 */
export const getGameAssets = () => {
  return gameAssets;
};
