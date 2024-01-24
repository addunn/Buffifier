

import { WorkerSystem } from "./Buffifier.js";  

addEventListener("message", WorkerSystem.onWorkerReceiveMessage);

setTimeout(() => {
    console.log("worker sending LOADED");
    postMessage([WorkerSystem.messages.LOADED]);
}, 10);













