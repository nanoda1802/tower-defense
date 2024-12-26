import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';

export const registerHandler = async (io, socket, data) => {
  const { email, password } = data.payload;

  // 이메일과 비밀번호가 제공되었는지 확인
  if (!email || !password) {
    socket.emit('response', { status: 'fail', message: 'Email and password are required.' });
    return;
  }

  try {
    // 이메일 중복 여부 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      socket.emit('response', { status: 'fail', message: '이미 존재하는 email 입니다.' });
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새로운 사용자 생성
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    console.log(`User registered: ${email}`);
    return { status: 'success', message: 'User registered successfully.' };
  } catch (error) {
    console.error('Error during registration:', error);
    return { status: 'fail', message: 'Registration failed.' };
  }
};
