import { Buffifier, BufferedArray, DataTypes } from "../Buffifier.js";
import { BaseThread } from "./Base.js";
import { Entity } from "../Entity.js";
import { World } from "../World.js";

export class MainThread extends BaseThread {

    static _meta = {

        get props() { 

            return {
                threadId: DataTypes.Uint8,
                test1: DataTypes.Uint32
            }
            
        }

    };

    app = null;

    init = async (app) => {
        
        return new Promise(async (resolve) => {


            this.app = app;

            app.canvasWidth = document.body.offsetWidth;
            app.canvasHeight = document.body.offsetHeight;

            this.setupEventListeners();

            app.world = Buffifier.createInstance(World);

            app.world.items = Buffifier.createInstance(BufferedArray, {
                of: DataTypes.Entity
            }, {
                workingSpace: 300000 * 4 // 300000 items allowed
            });


            app.mouseOverEntityIndices = Buffifier.createInstance(BufferedArray, {
                of: DataTypes.Uint32
            }, {
                workingSpace: 100 * 4 // 100 items allowed
            });

            for(let n = 0; n < 100; n++) {

                const entity = Buffifier.createInstance(Entity, {
                    x: (Math.random() * World.width) - (World.width / 2),
                    z: (Math.random() * World.depth) - (World.depth / 2),
                    speed: Math.random()
                });



                await app.world.items.push(entity);

            }


            

            resolve();

        });
    }

    work = async () => {
        return new Promise(async (resolve) => {

            resolve();

        });
    }


    setupEventListeners() {
        
        ["mousedown","mouseup"].forEach(s => document.addEventListener(s, (e) => {
            this.app.mouseDown = (e.type === "mousedown") ? (e.button + 1) : 0;
        }));

        document.addEventListener("wheel", (e) => {
            this.app.mouseWheelDeltaY += e.deltaY;
        });

        document.addEventListener("mousemove", (e) => {
            this.app.mouseX = e.clientX;
            this.app.mouseY = e.clientY;
        });

        window.addEventListener("resize", () => {
            this.app.canvasWidth = document.body.offsetWidth;
            this.app.canvasHeight = document.body.offsetHeight;
        });

    }


    
    
}









