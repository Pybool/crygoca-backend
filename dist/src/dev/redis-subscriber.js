"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default();
setTimeout(() => {
    redis.subscribe("worker-status", (err, count) => {
        if (err)
            console.error(err.message);
        console.log(`Subscribed to ${count} channels.`);
    });
    redis.on("message", (channel, message) => {
        console.log(channel, message);
    });
}, 30000);
// // Optionally, create a publisher to send messages to the worker
// const publisher = redis.createClient();
// // Send an initial message to the worker
// publisher.publish('worker-task', 'Start the task!');
