"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadedPeriodicTaskScheduler = exports.PeriodicTaskScheduler = void 0;
// import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
class PeriodicTaskScheduler {
    constructor() {
        this.tasks = new Map();
    }
    addTask(id, callback, interval) {
        if (this.tasks.has(id)) {
            throw new Error(`Task with id "${id}" is already registered.`);
        }
        const task = {
            id,
            callback,
            interval,
            timer: setInterval(async () => {
                try {
                    await callback();
                }
                catch (error) {
                    console.error(`Error occurred in task "${id}":`, error);
                }
            }, interval),
        };
        this.tasks.set(id, task);
        console.log(`Task "${id}" added to the scheduler.`);
    }
    removeTask(id) {
        const task = this.tasks.get(id);
        if (!task) {
            console.warn(`Task with id "${id}" does not exist.`);
            return;
        }
        clearInterval(task.timer);
        this.tasks.delete(id);
        console.log(`Task "${id}" removed from the scheduler.`);
    }
    updateTaskInterval(id, newInterval) {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(`Task with id "${id}" does not exist.`);
        }
        clearInterval(task.timer);
        task.interval = newInterval;
        task.timer = setInterval(async () => {
            try {
                await task.callback();
            }
            catch (error) {
                console.error(`Error occurred in task "${id}":`, error);
            }
        }, newInterval);
        console.log(`Task "${id}" interval updated to ${newInterval}ms.`);
    }
    stopAllTasks() {
        for (const task of this.tasks.values()) {
            clearInterval(task.timer);
        }
        this.tasks.clear();
        console.log("All tasks have been stopped and the scheduler is cleared.");
    }
}
exports.PeriodicTaskScheduler = PeriodicTaskScheduler;
class ThreadedPeriodicTaskScheduler {
    constructor() {
        this.tasks = new Map();
    }
    addTask(id, callback, interval) {
        if (this.tasks.has(id)) {
            throw new Error(`Task with id "${id}" is already registered.`);
        }
        const worker = new Worker(__filename, {
            workerData: { id, interval, callback: callback.toString() },
        });
        worker.on("message", (message) => {
            console.log(`Task "${id}" message:`, message);
        });
        worker.on("error", (error) => {
            console.error(`Task "${id}" encountered an error:`, error);
        });
        worker.on("exit", (code) => {
            if (code !== 0) {
                console.error(`Task "${id}" stopped with exit code ${code}.`);
            }
        });
        this.tasks.set(id, { id, worker });
        console.log(`Task "${id}" added to the scheduler.`);
    }
    removeTask(id) {
        const task = this.tasks.get(id);
        if (!task) {
            console.warn(`Task with id "${id}" does not exist.`);
            return;
        }
        task.worker.terminate();
        this.tasks.delete(id);
        console.log(`Task "${id}" removed from the scheduler.`);
    }
    stopAllTasks() {
        for (const task of this.tasks.values()) {
            task.worker.terminate();
        }
        this.tasks.clear();
        console.log("All tasks have been stopped and the scheduler is cleared.");
    }
}
exports.ThreadedPeriodicTaskScheduler = ThreadedPeriodicTaskScheduler;
if (!isMainThread) {
    const { id, interval, callback } = workerData;
    const taskCallback = eval(`(${callback})`);
    const timer = setInterval(async () => {
        try {
            await taskCallback();
            parentPort?.postMessage(`Task "${id}" executed successfully.`);
        }
        catch (error) {
            parentPort?.postMessage(`Task "${id}" encountered an error: ${error.message}`);
        }
    }, interval);
    parentPort?.on("message", (message) => {
        if (message === "terminate") {
            clearInterval(timer);
            parentPort?.postMessage(`Task "${id}" terminated.`);
            process.exit(0);
        }
    });
}
