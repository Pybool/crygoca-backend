export default {
  generic: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_GENERIC_PORT as string || '6379'),
    password: process.env.REDIS_PASSWORD
  }
};
  
