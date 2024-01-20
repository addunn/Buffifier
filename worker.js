

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

const tick = async () => {

    Atomics.wait(Buffifier.int32Array, Buffifier.signalIndex, 0);

    await worker.work();

    tick();
}

let attachments = null;

const onMessage = async ({ data }) => {

    if(data[0] === "init") {

        worker = new workers[data[1]]();
        
        //console.log("FROM WORKER:", data, JSON.stringify(data[3]));
        await worker.init(Buffifier.getFirstObject(), data[2], attachments);

        postMessage(["ready"]);

        tick();

    } else if(data[0] === "init-buffer") {

        attachments = data[1];
        //Buffifier.init([State, World, Entity, ArrayObject], data[1]);
        Buffifier.init([State, World, Entity, ArrayObject], data[2]);
    }

};

addEventListener("message", onMessage);

setTimeout(() => {
    postMessage(["loaded"]);
}, 10);













