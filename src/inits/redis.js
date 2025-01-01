import { createClient } from 'redis';
// Redis 연결
const redisClient = createClient({
  url: 'redis://:qwer1234@218.237.144.112:6379',
});

(async () => {
  try {
    await redisClient.connect(); // Redis 서버에 연결
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
})();

export default redisClient;
