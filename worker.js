

import { Buffifier, ArrayObject } from "./Buffifier.js";  
import { State } from "./State.js";  
import { World } from "./World.js";  
import { Entity } from "./Entity.js";  


import { EntityZSetterWorker } from "./workers/EntityZSetter.js";  
import { EntityMoverWorker } from "./workers/EntityMover.js";  
import { Renderer3DWorker } from "./workers/Renderer3D.js";  


const workers = {
    EntityZSetterWorker,
    EntityMoverWorker,
    Renderer3DWorker
};

let worker = null;
let workerIndex = null;


const tick = async () => {

    Atomics.wait(Buffifier.int32Array, Buffifier.signalIndex, 0);

    const n1 = performance.now();

    await worker.work();
    // worker.work();

    const temp = (performance.now()- n1) * 1000;
    Buffifier.storeMetaData(temp, 0);
    
    console.log("YAYA", temp, Buffifier.getWorkerMetaData(workerIndex, 0));

    tick();
}


const onMessage = async ({ data }) => {

    if(data[0] === "init") {

        workerIndex = data[3];
        
        Buffifier.init([State, World, Entity, ArrayObject], data[4], null, data[3]);

        worker = new workers[data[1]]();
        
        await worker.init(Buffifier.getFirstObject(), data[2]);

        postMessage(["ready"]);

        tick();

    }

};

addEventListener("message", onMessage);

setTimeout(() => {
    postMessage(["loaded"]);
}, 10);













