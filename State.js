import { DataTypes } from "./Buffifier.js";

export class State {

    static _meta = {

        props: {
            mouseX: DataTypes.Uint16,
            mouseY: DataTypes.Uint16,
            mouseDown: DataTypes.boolean,
            world: DataTypes.World
        }

    };

}
