import { DataTypes } from "../Buffifier.js";
import { BaseThread } from "./Base.js";

export class PathingThread extends BaseThread {

    static _meta = {

        get props() { 

            return {
                threadId: DataTypes.Uint8,
                test1: DataTypes.Uint32
            }
            
        }

    };

    app = null;

    init = async (app) => {
        
        return new Promise(async (resolve) => {

            this.app = app;

            resolve();

        });
    }

    work = async () => {
        return new Promise(async (resolve) => {

            resolve();

        });
    }
    
}









