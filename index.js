import { Buffifier, ArrayObject, DataTypes } from "./Buffifier.js";  
import { State } from "./State.js";  
import { World } from "./World.js";  
import { Entity } from "./Entity.js";  
import { RateCounter } from "./RateCounter.js";  

Buffifier.init([State, World, Entity, ArrayObject], null, {
    workers: 2,
    workerMetaDataAllocate: 8
});

const state = Buffifier.createInstance(State);

const world = Buffifier.createInstance(World);

const items = Buffifier.createInstance(ArrayObject, {
    of: DataTypes.Entity
}, {
    workingSpace: 300000 * 4 // 300000 items allowed
});

const worker0Speed = document.getElementById("worker0-speed");
const worker1Speed = document.getElementById("worker1-speed");
const mainThreadFPS = document.getElementById("main-fps");

state.world = world;

world.items = items;

const tooltips = [];

const app = {


    
    fps: null,

    mouseWheelDeltaY: 0,
    
    mouseX: 0,
    mouseY: 0,

    mouseDown: 0,

    keyWDown: false,
    keyADown: false,
    keySDown: false,
    keyDDown: false,

    canvasWidth: document.body.offsetWidth,
    canvasHeight: document.body.offsetHeight,

    workersCount: null,
    workers: {
        entityMover: null,
        //entityZSetter: null,
        renderer3D: null
    },

    start() {

        app.fps = new RateCounter();

        setInterval(() => {
            mainThreadFPS.innerText = app.fps.value;
            worker0Speed.innerText = Buffifier.getWorkerMetaData(0, 0);
            worker1Speed.innerText = Buffifier.getWorkerMetaData(1, 0);
        }, 500);

        app.tick = app.tock;
        app.tick();
    },

    tick: null,

    tock() {
        requestAnimationFrame(() => {



            app.setState();

            const workersSignaled = Buffifier.signalWorkers();

            


            for(let n = 0; n < world.items.length; n++) {

                const ent = world.items.get(n);
                
                let sY = ent.screenY;
                let sX = ent.screenX;

                tooltips[n].style.transform = "translate(" + (sX) + "px," + (sY) + "px)";
                

            }
    

            
            if(workersSignaled < app.workersCount) {
                console.log("WORKERS NOT SIGNALED", (app.workersCount - workersSignaled));
            }

            //setTimeout(() => {
                //console.log("TICK");
                app.tick();
            //}, 500);
            app.fps.log();

        });
    },

    setState() {

        state.mouseX = app.mouseX;
        state.mouseY = app.mouseY;

        //state.mouseWheelDeltaY = app.mouseWheelDeltaY;
        
        state.mouseDown = app.mouseDown;

        state.keyWDown = app.keyWDown;
        state.keyADown = app.keyADown;
        state.keySDown = app.keySDown;
        state.keyDDown = app.keyDDown;

        state.canvasWidth = app.canvasWidth;
        state.canvasHeight = app.canvasHeight;

    }
};

app.workersCount = Object.keys(app.workers).length;
app.setState();

const worldWidth = (world.cellSize * world.cellsX);
const worldDepth = (world.cellSize * world.cellsZ);

for(let n = 0; n < 500; n++) {
    //setInterval(() => {
        const entity = Buffifier.createInstance(Entity, {
            x: (Math.random() * worldWidth) - (worldWidth / 2),
            z: (Math.random() * worldDepth) - (worldDepth / 2),
            speed: Math.random()
        });
        
        const tt = document.createElement("div");
        tt.classList.add("tt");
        document.body.appendChild(tt);

        tooltips.push(tt);

        await items.push(entity);
    //}, 1000)
}

document.addEventListener("wheel", (e) => {
    state.mouseWheelDeltaY += e.deltaY;
});

["mousedown","mouseup"].forEach(s => document.addEventListener(s, (e) => {
    app.mouseDown = (e.type === "mousedown") ? (e.button + 1) : 0;
}));

["keydown","keyup"].forEach(s => document.addEventListener(s, (e) => {

    const down = (e.type === "keydown");

    if(e.code === "KeyW") {
        app.keyWDown = down;
    } else if(e.code === "KeyA") {
        app.keyADown = down;
    } else if(e.code === "KeyS") {
        app.keySDown = down;
    } else if(e.code === "KeyD") {
        app.keyDDown = down;
    }

}));

document.addEventListener("mousemove", (e) => {
    app.mouseX = e.clientX;
    app.mouseY = e.clientY;
});

window.addEventListener("resize", () => {
    app.canvasWidth = document.body.offsetWidth;
    app.canvasHeight = document.body.offsetHeight;
});



app.workers.entityMover = new Worker("worker.js?entityMover", { type: "module" });
//app.workers.entityZSetter = new Worker("worker.js?entityZSetter", { type: "module" });
app.workers.renderer3D = new Worker("worker.js?renderer3D", { type: "module" });

let ready = 0;

app.workers.renderer3D.addEventListener("message", (e) => {

    if(e.data[0] === "loaded") {

        const offscreen = document.getElementById("canvas").transferControlToOffscreen();

        app.workers.renderer3D.postMessage(["init", "Renderer3DWorker", {
            canvas: offscreen,
            devicePixelRatio: globalThis.devicePixelRatio
        }, 1, Buffifier.buffer], [offscreen]);

    } else if(e.data[0] === "ready") {
        console.log("renderer3D ready!");
        ready++;
    }
});


app.workers.entityMover.addEventListener("message", (e) => {

    if(e.data[0] === "loaded") {
        
        app.workers.entityMover.postMessage(["init", "EntityMoverWorker", {}, 0, Buffifier.buffer]);

    } else if(e.data[0] === "ready") {
        console.log("entityMover ready!");
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
    if(ready === app.workersCount) {
        app.start();
        clearInterval(int1);
    }
}, 100);

console.log(Buffifier.uint8Array);
console.log(state);
console.log(items);









