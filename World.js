import { DataTypes } from "./Buffifier.js";

export class World {


    cellSize = 10;

    cellsZ = 100;
    cellsX = 100;

    get width() {
        return this.cellSize * this.cellsX;
    }

    get depth() {
        return this.cellSize * this.cellsZ;
    }

    static _meta = {
        get props() {
            return {
                items: DataTypes.BufferedArray
            }
        }

    };

}
