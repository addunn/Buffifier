import { Buffifier, ArrayObject, DataTypes } from "./Buffifier.js";  
import { State } from "./State.js";  
import { World } from "./World.js";  
import { Entity } from "./Entity.js";  


// Initialize Buffifier on every thread with the classes you want to back with the buffer.
// Not supplying a SharedArrayBuffer will automatically create one and stored at Buffifier.buffer.
Buffifier.init([State, World, Entity, ArrayObject], null);

const state = Buffifier.createInstance(State);

const world = Buffifier.createInstance(World);

const items = Buffifier.createInstance(ArrayObject, {
    of: DataTypes.Entity
}, {
    workingSpace: 10000 * 4 // 10000 items allowed
});

for(let n = 0; n < 100; n++) {

    const entity = Buffifier.createInstance(Entity, {
        x: (Math.random() * 100) - 50,
        z: (Math.random() * 100) - 50,
        speed: Math.random()
    });
    
    await items.push(entity);

}

await world.items.set(items);

await state.world.set(world);

console.log(Buffifier.buffer);
console.log(state);
console.log(items);
