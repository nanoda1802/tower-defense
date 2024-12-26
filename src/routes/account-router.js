// import express from 'express';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import redis from 'redis';
// import crypto from 'crypto';

// const router = express.Router();
// const client = redis.createClient(); // Redis 클라이언트 생성

// // 환경 변수에서 SECRET_KEY 로드 또는 생성
// let SECRET_KEY = process.env.JWT_SECRET;
// if (!SECRET_KEY) {
//   // crypto를 사용해 SECRET_KEY 생성
//   SECRET_KEY = crypto.randomBytes(32).toString('hex');
//   console.log('Generated SECRET_KEY:', SECRET_KEY);
// }

// // 회원가입 API
// router.post('/register', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // 비밀번호 해싱
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Redis에 사용자 정보 저장
//     client.hset(
//       `user:${email}`,
//       'password',
//       hashedPassword,
//       'created_at',
//       new Date().toISOString(),
//       (err, reply) => {
//         if (err) return res.status(500).json({ error: 'Redis error' });

//         // JWT 생성
//         const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });

//         res.status(201).json({ message: 'User registered successfully', token });
//       },
//     );
//   } catch (err) {
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// // 로그인 API
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Redis에서 사용자 정보 조회
//     client.hget(`user:${email}`, 'password', async (err, storedPassword) => {
//       if (err || !storedPassword) return res.status(404).json({ error: 'User not found' });

//       // 비밀번호 검증
//       const isMatch = await bcrypt.compare(password, storedPassword);
//       if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

//       // JWT 생성 및 반환
//       const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
//       res.status(200).json({ message: 'Login successful', token });
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// export default router;
