import { DataTypes } from "./Buffifier.js";

export class Entity {

    static _meta = {

        props: {

            x: DataTypes.Float64,
            y: DataTypes.Float64,

            width: DataTypes.Float32,
            height: DataTypes.Float32,

            speed: DataTypes.Int8,


            energy: DataTypes.Uint8,

            atoms: DataTypes.BigUint64,


            parent: DataTypes.Entity//,

            //children: DataTypes.ArrayObject
            
        }

    };

}
