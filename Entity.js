import { DataTypes } from "./Buffifier.js";

export class Entity {

    width = 2;
    depth = 2;
    height = 10;

    static _meta = {

        get props() { 

            return {
                
                x: DataTypes.Float64,
                y: DataTypes.Float64,
                z: DataTypes.Float64,

                mouseOver: DataTypes.boolean,

                speed: DataTypes.Float32,

                screenX: DataTypes.Int32,
                screenY: DataTypes.Int32,
                cameraDistance: DataTypes.Float32
            }

        }

    };

}
