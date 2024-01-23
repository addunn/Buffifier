import { DataTypes } from "./Buffifier.js";

export class Entity {

    width = 5;
    depth = 5;
    height = 10;

    static _meta = {

        props: {

            x: DataTypes.Float64,
            y: DataTypes.Float64,
            z: DataTypes.Float64,

            speed: DataTypes.Float32,

            screenX: DataTypes.Int32,
            screenY: DataTypes.Int32,
            cameraDistance: DataTypes.Float32

        }

    };

}
