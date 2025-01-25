import Redis from "ioredis";

const redis = new Redis();

setTimeout(() => {
  redis.subscribe("worker-status", (err, count) => {
    if (err) console.error(err.message);
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
