"use strict";
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
process.env.NODE_ENV = 'prod';
module.exports = {
    apps: [
        {
            name: "crygoca",
            script: "./dist/src/bootstrap/server.js",
            env_production: Object.assign({ NODE_ENV: "prod" }, process.env)
        }
    ]
};
