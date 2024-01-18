import { DataTypes } from "./Buffifier.js";

export class Entity {

    static _meta = {

        props: {

            x: DataTypes.Float64,
            y: DataTypes.Float64,
            z: DataTypes.Float64,

            speedX: DataTypes.Float32,
            speedY: DataTypes.Float32,
            speedZ: DataTypes.Float32,

            size: DataTypes.Float64,

            screenX: DataTypes.Float32,
            screenY: DataTypes.Float32,
            
            cameraDistance: DataTypes.Float32

        }

    };

}
