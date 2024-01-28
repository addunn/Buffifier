import { DataTypes } from "./Buffifier.js";

export class World {

    static _meta = {
        get props() {
            return {
                heightData: DataTypes.BufferedArray,
                items: DataTypes.BufferedArray
            }
        }
    };


    static cellSize = 10;

    static segments = 60;

    static get cellsZ() {
        return this.segments;
    }

    static get cellsX() {
        return this.segments;
    }

    static get size() {
        return this.cellSize * this.segments;
    }

    static get width() {
        return this.size;
    }

    static get depth() {
        return this.size;
    }

    


    

}
