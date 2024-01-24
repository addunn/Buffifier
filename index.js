import { Buffifier, DataTypes } from "./Buffifier.js";  
import { App } from "./App.js";  
import { World } from "./World.js";  
import { BufferedArray } from "./BufferedArray.js";  
import { Entity } from "./Entity.js";  

const app = Buffifier.init(App, document.getElementById("canvas"));

app.canvasWidth = document.body.offsetWidth;
app.canvasHeight = document.body.offsetHeight;

app.world = Buffifier.createInstance(World);

app.world.items = Buffifier.createInstance(BufferedArray, {
    of: DataTypes.Entity
}, {
    workingSpace: 300000 * 4 // 300000 items allowed
});

const worldWidth = (app.world.cellSize * app.world.cellsX);
const worldDepth = (app.world.cellSize * app.world.cellsZ);

for(let n = 0; n < 500; n++) {

    const entity = Buffifier.createInstance(Entity, {
        x: (Math.random() * worldWidth) - (worldWidth / 2),
        z: (Math.random() * worldDepth) - (worldDepth / 2),
        speed: Math.random()
    });

    await app.world.items.push(entity);

}











