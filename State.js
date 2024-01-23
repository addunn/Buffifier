import { DataTypes } from "./Buffifier.js";

export class State {

    static _meta = {

        props: {
            
            mouseX: DataTypes.Uint16,
            mouseY: DataTypes.Uint16,

            mouseDown: DataTypes.Uint8,

            keyWDown:  DataTypes.boolean,
            keyADown:  DataTypes.boolean,
            keySDown:  DataTypes.boolean,
            keyDDown:  DataTypes.boolean,

            mouseWheelDeltaY: DataTypes.Int16,

            canvasWidth: DataTypes.Uint16,
            canvasHeight: DataTypes.Uint16,

            world: DataTypes.World

        }

    };

}
