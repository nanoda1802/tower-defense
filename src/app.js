import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http'; // node.js가 기본 보유 중인 모듈
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import redisClient from './inits/redis.js'; // Redis 클라이언트 가져오기
import initSocket from './inits/socket.js';
import { loadGameAssets } from './inits/assets.js';
import AccountRouter from './routes/account-router.js';
import rankingRouter from './routes/ranking-router.js'; // 랭킹 라우터

// .env 파일 로드
dotenv.config();

/* [1] express 서버 생성 */
const app = express();
const server = createServer(app);
const PORT = 3000;

// Redis와 Express 세션 연동
const redisStore = new RedisStore({
  client: redisClient,
});

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }, // 1시간
  }),
);

// CORS 설정
const corsOptions = {
  origin: 'http://127.0.0.1:8080', // 허용할 클라이언트 도메인
  methods: ['GET', 'POST', 'DELETE'], // 허용할 HTTP 메서드
  credentials: true, // 쿠키 및 인증 정보 포함 여부
};

/* body parsers */
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/* [2] 정적 파일 서비스 */
app.use(express.static('public')); // public 폴더 내의 파일을 정적 상태로 외부로 제공
// Router
app.use('/api/ranking', rankingRouter);
app.use(
  '/api/account',
  (req, res, next) => {
    req.redisClient = redisClient; // 요청 객체에 Redis 클라이언트 추가
    next();
  },
  AccountRouter,
);
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
    console.log('Assets loaded successfully');
  } catch (err) {
    // [5-2 b] 에러 메세지 및 내용 출력
    console.error('Failed to load game assets', err);
  }
});
