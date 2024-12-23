const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

module.exports = {
  apps: [
    {
      name: "crygoca",
      script: "./dist/server.js",
      env_production: {
        NODE_ENV: "prod",
        ...process.env
      }
    }
  ]
};