import { DataTypes } from "./Buffifier.js";

export class World {


    cellSize = 10;

    cellsZ = 100;
    cellsX = 100;


    static _meta = {

        props: {
            items: DataTypes.ArrayObject
        }

    };

}
