"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = {
    generateOtp: () => {
        const otp = Math.floor(1000 + Math.random() * 9000);
        return otp.toString();
    },
    telcoSimulate: (ms, phone) => {
        return new Promise((resolve, reject) => {
            console.log("Task started...");
            setTimeout(() => {
                console.log("Task completed!");
                resolve({ status: true, phone: phone });
            }, ms);
        });
    },
    formatDateToCustomString: (date) => {
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);
        const period = date.getHours() < 12 ? "am" : "pm";
        return `${year}-${month}-${day} ${hours}:${minutes}${period}`;
    },
    wss: null,
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },
    userConnections: new Map(),
};
exports.default = utils;
