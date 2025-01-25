// import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

interface Task {
  id: string;
  interval: number;
  callback: () => Promise<void> | void;
  timer?: NodeJS.Timeout;
}

export class PeriodicTaskScheduler {
  private tasks: Map<string, Task> = new Map();

  addTask(id: string, callback: () => Promise<void> | void, interval: number): void {
    if (this.tasks.has(id)) {
      throw new Error(`Task with id "${id}" is already registered.`);
    }

    const task: Task = {
      id,
      callback,
      interval,
      timer: setInterval(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`Error occurred in task "${id}":`, error);
        }
      }, interval),
    };

    this.tasks.set(id, task);
    console.log(`Task "${id}" added to the scheduler.`);
  }

  removeTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.warn(`Task with id "${id}" does not exist.`);
      return;
    }

    clearInterval(task.timer);
    this.tasks.delete(id);
    console.log(`Task "${id}" removed from the scheduler.`);
  }

  updateTaskInterval(id: string, newInterval: number): void {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task with id "${id}" does not exist.`);
    }

    clearInterval(task.timer);
    task.interval = newInterval;
    task.timer = setInterval(async () => {
      try {
        await task.callback();
      } catch (error) {
        console.error(`Error occurred in task "${id}":`, error);
      }
    }, newInterval);

    console.log(`Task "${id}" interval updated to ${newInterval}ms.`);
  }

  stopAllTasks(): void {
    for (const task of this.tasks.values()) {
      clearInterval(task.timer);
    }
    this.tasks.clear();
    console.log("All tasks have been stopped and the scheduler is cleared.");
  }
}

interface ThreadedTask {
  id: string;
  worker: Worker;
}

export class ThreadedPeriodicTaskScheduler {
  private tasks: Map<string, ThreadedTask> = new Map();

  addTask(id: string, callback: () => Promise<void> | void, interval: number): void {
    if (this.tasks.has(id)) {
      throw new Error(`Task with id "${id}" is already registered.`);
    }

    const worker = new Worker(__filename, {
      workerData: { id, interval, callback: callback.toString() },
    });

    worker.on("message", (message: string) => {
      console.log(`Task "${id}" message:`, message);
    });

    worker.on("error", (error: Error) => {
      console.error(`Task "${id}" encountered an error:`, error);
    });

    worker.on("exit", (code: number) => {
      if (code !== 0) {
        console.error(`Task "${id}" stopped with exit code ${code}.`);
      }
    });

    this.tasks.set(id, { id, worker });
    console.log(`Task "${id}" added to the scheduler.`);
  }

  removeTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      console.warn(`Task with id "${id}" does not exist.`);
      return;
    }

    task.worker.terminate();
    this.tasks.delete(id);
    console.log(`Task "${id}" removed from the scheduler.`);
  }

  stopAllTasks(): void {
    for (const task of this.tasks.values()) {
      task.worker.terminate();
    }
    this.tasks.clear();
    console.log("All tasks have been stopped and the scheduler is cleared.");
  }
}

if (!isMainThread) {
  const { id, interval, callback } = workerData as {
    id: string;
    interval: number;
    callback: string;
  };

  const taskCallback = eval(`(${callback})`);
  const timer = setInterval(async () => {
    try {
      await taskCallback();
      parentPort?.postMessage(`Task "${id}" executed successfully.`);
    } catch (error: any) {
      parentPort?.postMessage(`Task "${id}" encountered an error: ${error.message}`);
    }
  }, interval);

  parentPort?.on("message", (message: string) => {
    if (message === "terminate") {
      clearInterval(timer);
      parentPort?.postMessage(`Task "${id}" terminated.`);
      process.exit(0);
    }
  });
}
