const dotenv = require('dotenv');
dotenv.config({ path: '.env.prod' });
process.env.NODE_ENV='prod'
module.exports = {
  apps: [
    {
      name: "crygoca",
      script: "./dist/src/bootstrap/index.js",
      env_production: {
        NODE_ENV: "prod",
        ...process.env
      }
    }
  ]
};