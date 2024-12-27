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

// 회원가입 API
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Received request:', req.body);

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

    // JWT 생성
    // JWT 생성 (userId 포함)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '1h' },
    );

    // 접속 기록을 Redis에 저장
    const loginTime = new Date().toISOString();
    await redisClient.set(`user:${email}:lastLogin`, loginTime);

    // 세션 데이터 저장
    if (req.session) {
      req.session.user = { email }; // 세션에 사용자 정보 저장
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: '세션 저장 중 오류 발생' });
        }
        res.status(200).json({ message: '로그인 성공', token });
      });
    } else {
      console.error('Session is not initialized');
      res.status(500).json({ message: '세션 초기화 오류' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
