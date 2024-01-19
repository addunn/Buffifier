import { DataTypes } from "./Buffifier.js";

export class Entity {

    static _meta = {

        props: {

            x: DataTypes.Float64,
            y: DataTypes.Float64,
            z: DataTypes.Float64,

            speed: DataTypes.Float32,

            screenX: DataTypes.Float32,
            screenY: DataTypes.Float32,
            cameraDistance: DataTypes.Float32

        }

    };

}
