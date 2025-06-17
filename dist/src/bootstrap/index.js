"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decrypt_env_1 = require("../env/decrypt-env");
const bootstrapServer = async () => {
    await (0, decrypt_env_1.setUpSecrets)();
    require("./server");
};
bootstrapServer();
