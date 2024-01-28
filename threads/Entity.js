import { DataTypes } from "../Buffifier.js";
import { BaseThread } from "./Base.js";

export class EntityThread extends BaseThread {

    static _meta = {

        get props() { 

            return {
                threadId: DataTypes.Uint8,
                test1: DataTypes.Uint32
            }
            
        }

    };

    app = null;

    entities = null;

    init = async (app) => {
        
        return new Promise(async (resolve) => {

            this.app = app;
            this.entities = app.world.items;

            resolve();

        });
    }

    work = async () => {
        return new Promise(async (resolve) => {


            
            for(const o of this.entities) {
                o.x = o.x + ((Math.random() - 0.1) / 5);
                o.z = o.z + ((Math.random() - 0.1) / 5);
                o.mouseOver = false;
            }

            //const mouseOverEnts = [...this.app.mouseOverEntityIndices];


            for(const n of this.app.mouseOverEntityIndices) {
                this.entities.at(n).mouseOver = true;
            }

            resolve();

        });
    }
    
}









