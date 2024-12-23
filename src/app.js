import express from "express";
import { createServer } from "http"; // node.js가 기본 보유 중인 모듈
import initSocket from "./init/socket.js";
import { loadGameAssets } from "./inits/assets.js";

/* [1] express 서버 생성 */
const app = express();
const server = createServer(app);
const PORT = 3000;
/* body parsers */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/* [2] 정적 파일 서비스 */
app.use(express.static("public")); // public 폴더 내의 파일을 정적 상태로 외부로 제공
/* [3] 소켓 초기화 */
initSocket(server); // 소켓은 실시간 통신을 돕는 역할

/* [4] 서버 오픈 */
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  /* [5] 게임에 필요한 재료 데이터들 불러오기 */
  try {
    // [5-1] 각 재료 데이터 담긴 JSON 객체가 담긴 gameAssets 객체를 assets 변수에 할당 ㅋㅋ
    const assets = await loadGameAssets();
    // [5-2 a] 불러온 재료 데이터 및 성공 메세지 출력
    console.log(assets);
    console.log("Assets loaded successfully");
  } catch (err) {
    // [5-2 b] 에러 메세지 및 내용 출력
    console.error("Failed to load game assets", err);
  }
});
