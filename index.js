import { Buffifier } from "./Buffifier.js";  
import { Entity } from "./Entity.js";  

// Initialize Buffifier on every thread with the classes you want to back with the buffer.
// Not supplying a SharedArrayBuffer will automatically create one and stored at Buffifier.buffer.
Buffifier.init([Entity], null);

const instanceValues = {
    x: Math.PI,
    y: Math.sqrt(2),
    width: 55.5,
    height: 55.5,
    speed: 50,
    energy: 200,
    atoms: BigInt(Number.MAX_SAFE_INTEGER) * 2n,
    parent: null
}

// This will create an instance of Entity and store it in the SharedArrayBuffer (Buffifier.buffer)
const entity1 = Buffifier.createObject(Entity, instanceValues);

// set a specific prop by calling prop.set()
await entity1.x.set(-Math.PI);

// get the value of a prop by calling prop.get()
for(const k of Object.keys(entity1)){
    console.log(k, await entity1[k].get());
}

