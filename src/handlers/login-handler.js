import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import redisClient from '../inits/redis.js'; // Redis 클라이언트 import

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key';

export const loginHandler = async (io, socket, data) => {
  const { email, password } = data.payload;

  if (!email || !password) {
    socket.emit('response', { status: 'fail', message: 'Email and password are required.' });
    return;
  }

  try {
    // MySQL에서 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      socket.emit('response', { status: 'fail', message: 'User not found.' });
      return;
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      socket.emit('response', { status: 'fail', message: 'Invalid password.' });
      return;
    }

    // JWT 생성
    const token = jwt.sign({ userId: user.id, email }, SECRET_KEY, { expiresIn: '1h' });

    // Redis에 세션 저장
    await redisClient.set(`session:${user.id}`, token, 'EX', 3600);

    console.log(`User logged in: ${email}`);
    socket.emit('response', { status: 'success', message: 'Login successful.', token });
  } catch (error) {
    console.error('Error during login:', error);
    socket.emit('response', { status: 'fail', message: 'Login failed.' });
  }
};
