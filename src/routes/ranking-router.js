import express from 'express';
import redisClient from '../inits/redis.js'; // Redis 클라이언트

const router = express.Router();

// 랭킹 조회 라우터
router.get('/', async (req, res) => {
  try {
    // Redis에서 상위 10개의 랭킹 데이터를 가져옴
    const leaderboardData = await redisClient.sendCommand([
      'ZREVRANGE',
      'leaderboard',
      '0',
      '9',
      'WITHSCORES',
    ]);

    // 데이터 변환: 순위, 이메일, 점수 포함
    const leaderboard = [];
    for (let i = 0; i < leaderboardData.length; i += 2) {
      leaderboard.push({
        rank: Math.floor(i / 2) + 1,
        email: leaderboardData[i], // 이메일 값
        score: parseInt(leaderboardData[i + 1], 10), // 점수 값 (정수형 변환)
      });
    }

    // 응답 반환
    res.status(200).json({
      status: 'success',
      leaderboard,
    });
  } catch (err) {
    console.error('랭킹 조회 실패:', err);
    res.status(500).json({
      status: 'error',
      message: '랭킹 데이터를 가져오는 중 오류가 발생했습니다.',
    });
  }
});

export default router;
