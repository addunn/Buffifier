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

for(let n = 0; n < 1000; n++) {

    const entity = Buffifier.createInstance(Entity, {
        x: (Math.random() * (world.cellSize * world.cellsX)) - ((world.cellSize * world.cellsX) / 2),
        z: (Math.random() * (world.cellSize * world.cellsZ)) - ((world.cellSize * world.cellsZ) / 2),
        speed: Math.random()
    });
    
    await items.push(entity);

}

await world.items.set(items);

await state.world.set(world);




const app = {
    

    mouseX: 0,
    mouseY: 0,
    canvasWidth: document.body.offsetWidth,
    canvasHeight: document.body.offsetHeight,
    mouseDown: false,

    workers: {
        entityMover: null,
        entityZSetter: null,
        renderer3D: null

    },
    start() {
        console.log("APP START!");
        app.tick = app.tock;
        app.tick();
    },
    tick: null,
    tock() {
        requestAnimationFrame(async () => {

            await app.setState();

            Buffifier.signalWorkers();


            //setTimeout(() => {
              //  console.log("TICK");
                app.tick();
            //}, 10);
            
        
        });
    },
    async setState() {
        await state.mouseX.set(app.mouseX);
        await state.mouseY.set(app.mouseY);
        await state.mouseDown.set(app.mouseDown);
        await state.canvasWidth.set(app.canvasWidth);
        await state.canvasHeight.set(app.canvasHeight);
    }

};

await app.setState();



document.addEventListener("mousedown", (e) => {
    app.mouseDown = true;
});

document.addEventListener("mouseup", (e) => {
    app.mouseDown = false;
});

document.addEventListener("mousemove", (e) => {
    app.mouseX = e.clientX;
    app.mouseY = e.clientY;
});

window.addEventListener("resize", () => {
    app.canvasWidth = document.body.offsetWidth;
    app.canvasHeight = document.body.offsetHeight;
});
window.addEventListener("keydown", () => {
    
});





app.workers.entityMover = new Worker("worker.js?entityMover", { type: "module" });
//app.workers.entityZSetter = new Worker("worker.js?entityZSetter", { type: "module" });
app.workers.renderer3D = new Worker("worker.js?renderer3D", { type: "module" });

let ready = 0;


app.workers.renderer3D.addEventListener("message", (e) => {

    if(e.data[0] === "loaded") {

        //const offScreenCanvas = document.getElementById("canvas").transferControlToOffscreen();

        const c = document.querySelector("canvas");

        c.width = app.canvasWidth;
        c.height = app.canvasHeight;
        
        const offscreen = c.transferControlToOffscreen();


        app.workers.renderer3D.postMessage(["init-buffer", offscreen, Buffifier.buffer], [offscreen]);

        app.workers.renderer3D.postMessage(["init", "Renderer3DWorker", {
            devicePixelRatio: globalThis.devicePixelRatio
        }]);//, offscreen], [offscreen]);

    } else if(e.data[0] === "ready") {
        ready++;
    }
});


app.workers.entityMover.addEventListener("message", (e) => {

    if(e.data[0] === "loaded") {

        app.workers.entityMover.postMessage(["init-buffer", null, Buffifier.buffer]);

        app.workers.entityMover.postMessage(["init", "EntityMoverWorker", {}]);

    } else if(e.data[0] === "ready") {
        ready++;
    }
});
/*
app.workers.entityZSetter.addEventListener("message", (e) => {

    if(e.data[0] === "loaded") {
        app.workers.entityZSetter.postMessage(["init-buffer", Buffifier.buffer]);

        app.workers.entityZSetter.postMessage(["init", "EntityZSetterWorker", {}, null]);
    } else if(e.data[0] === "ready") {
        ready++;
    }
});
*/

const int1 = setInterval(() => {
    if(ready > 1) {
        app.start();
        clearInterval(int1);
    }
}, 100);

console.log(Buffifier.uint8Array);
console.log(state);
console.log(items);









