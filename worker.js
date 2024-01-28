import { WorkerSystem } from "./Buffifier.js";  

addEventListener("message", WorkerSystem.onWorkerReceiveMessage);

setTimeout(() => {
    postMessage([WorkerSystem.messages.LOADED]);
}, 10);













