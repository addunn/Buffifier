import { Buffifier, DataTypes } from "./Buffifier.js";  
import { Entity } from "./Entity.js";  


// Initialize Buffifier on every thread with the classes you want to back with the buffer.
// Not supplying a SharedArrayBuffer will automatically create one and stored at Buffifier.buffer.
Buffifier.init([Entity], null);

/*
const arr1 = Buffifier.createObject(ArrayObject, {
    of: DataTypes.Entity
}, {
    workingSpace: 100000 * 4 // 100000 items allowed
});
*/



const entity1Values = {
    x: Math.PI,
    y: Math.sqrt(2),
    z: Math.E
}

// This will create an instance of Entity and store it in the SharedArrayBuffer (Buffifier.buffer)
const entity1 = Buffifier.createObject(Entity, entity1Values);


// Set a specific prop by calling prop.set()
await entity1.x.set(-Math.PI);

console.log(entity1);
console.log(Buffifier.buffer);


// Get the value of a prop by calling prop.get()
for(const k of Object.keys(entity1)){
    console.log(k, await entity1[k].get());
}
