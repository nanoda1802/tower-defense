import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../inits/prisma.js';
import crypto from 'crypto';

const router = express.Router();

// 환경 변수에서 SECRET_KEY 로드 또는 생성
let SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  SECRET_KEY = crypto.randomBytes(32).toString('hex');
  console.log('Generated SECRET_KEY:', SECRET_KEY);
}

// 이메일과 비밀번호 검증 함수
const validateEmail = (email) => {
  const emailRegex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,}$/; // 소문자와 숫자로 시작하며 '@', '.' 포함
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{6,}$/; // 최소 6자리, 소문자와 숫자 포함
  return passwordRegex.test(password);
};

// 회원가입 API
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Received request:', req.body);

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
    }

    // 비밀번호 형식 검증
    if (!validatePassword(password)) {
      return res.status(400).json({
        message: '비밀번호는 최소 6자리이며, 소문자와 숫자를 포함해야 합니다.',
      });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // MySQL에 사용자 정보 저장
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // JWT 생성
    const token = jwt.sign({ email: newUser.email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(201).json({ message: '회원가입이 완료되었습니다.', token });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const redisClient = req.redisClient; // app.js에서 전달된 Redis 클라이언트
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // 클라이언트 IP 가져오기

  try {
    // MySQL에서 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '잘못된 자격 증명입니다.' });
    }

    // Redis에서 세션 상태 확인
    const sessionKey = `session:${email}`;
    const existingSession = await redisClient.hGetAll(sessionKey);

    if (existingSession && existingSession.ip === clientIp) {
      return res.status(400).json({ message: '이미 로그인된 계정입니다.' });
    }

    // JWT 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '1h' },
    );

    // Redis에 세션 데이터 저장 (Hash 형식)
    await redisClient.hSet(sessionKey, {
      userId: user.id,
      email: user.email,
      ip: clientIp,
      loginTime: new Date().toISOString(),
      token,
    });

    // TTL 설정 (1시간)
    await redisClient.expire(sessionKey, 3600);

    res.status(200).json({ message: '로그인 성공', token, email });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/logout', async (req, res) => {
  const redisClient = req.redisClient; // app.js에서 전달된 Redis 클라이언트
  const { email } = req.body;

  try {
    // Authorization 헤더에서 JWT 토큰 추출
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // JWT 토큰 검증 및 이메일 일치 여부 확인
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');

      if (!decoded.email || decoded.email !== email) {
        console.warn(`Token email (${decoded.email}) does not match request email (${email}).`);
        return res.status(401).json({ message: 'Invalid token for the provided email.' });
      }
    } catch (err) {
      console.error('JWT verification error:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Redis에서 세션 삭제
    const sessionKey = `session:${email}`;
    console.log('sessionKey : ', sessionKey);

    const sessionExists = await redisClient.exists(sessionKey);

    if (sessionExists) {
      await redisClient.del(sessionKey);
      console.log(`Session ${sessionKey} deleted from Redis.`);
    } else {
      console.warn(`Session ${sessionKey} does not exist in Redis.`);
      return res.status(404).json({ message: '세션이 존재하지 않습니다.' });
    }

    // 쿠키 삭제
    res.clearCookie('connect.sid');

    res.status(200).json({ message: '로그아웃 성공' });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
