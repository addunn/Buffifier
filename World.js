import { DataTypes } from "./Buffifier.js";

export class World {

    static _meta = {

        props: {

            rotateX: DataTypes.Float32,
            rotateY: DataTypes.Float32,
            rotateZ: DataTypes.Float32,

            children: DataTypes.ArrayObject
            
        }

    };

}
