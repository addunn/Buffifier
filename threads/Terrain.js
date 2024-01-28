
import { Buffifier, BufferedArray, DataTypes } from "../Buffifier.js";
import { BaseThread } from "./Base.js";
import { Entity } from "../Entity.js";
import { World } from "../World.js";

import { ImprovedNoise } from '../three/addons/math/ImprovedNoise.js';

export class TerrainThread extends BaseThread {

    static _meta = {

        get props() { 

            return {
                threadId: DataTypes.Uint8,
                test1: DataTypes.Uint32
            }
            
        }

    };

    app = null;

    entities = null;

    heightData = null;

    currentIndex = -100;

    init = async (app) => {
        
        return new Promise(async (resolve) => {

            this.app = app;

            this.entities = app.world.items;

            this.buildTerrain();


            resolve();

        });
    }

    work = async () => {
        return new Promise(async (resolve) => {


            const cellSize = World.cellSize;
            const getY = (p1, p2, p3, x, z) => {
                let det = (p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z);

                let l1 = ((p2.z - p3.z) * (x - p3.x) + (p3.x - p2.x) * (z - p3.z)) / det;
                let l2 = ((p3.z - p1.z) * (x - p3.x) + (p1.x - p3.x) * (z - p3.z)) / det;
                let l3 = 1 - l1 - l2;

                return l1 * p1.y + l2 * p2.y + l3 * p3.y;
            };


            for(const o of this.entities) {



                const verticesX = World.cellsX + 1;
                //const verticesZ = World.cellsZ + 1;

                const x = o.x + (World.cellsX * World.cellSize) / 2;
                const z = o.z + (World.cellsZ * World.cellSize) / 2;

                let xIndex = Math.floor(x / 10);
                let zIndex = Math.floor(z / 10);


                const vert0 = {
                    x: xIndex * cellSize,
                    y: this.heightData[(zIndex * verticesX) + xIndex],
                    z: zIndex * cellSize,
                };
                const vert1 = {
                    x: (xIndex + 1) * cellSize,
                    y: this.heightData[(zIndex * verticesX) + xIndex + 1],
                    z: zIndex * cellSize,
                };
                const vert2 = {
                    x: xIndex * cellSize,
                    y: this.heightData[((zIndex + 1) * verticesX) + xIndex],
                    z: (zIndex + 1) * cellSize,
                };
                const vert3 = {
                    x: (xIndex + 1) * cellSize,
                    y: this.heightData[((zIndex + 1) * verticesX) + xIndex + 1],
                    z: (zIndex + 1) * cellSize,
                };






                const dist0 = Math.sqrt(Math.pow(x - vert0.x, 2) + Math.pow(z - vert0.z, 2));
                //const dist1 = Math.sqrt(Math.pow(x - vert1.x, 2) + Math.pow(z - vert1.z, 2));
                //const dist2 = Math.sqrt(Math.pow(x - vert2.x, 2) + Math.pow(z - vert2.z, 2));
                const dist3 = Math.sqrt(Math.pow(x - vert3.x, 2) + Math.pow(z - vert3.z, 2));

                let y = 0;

                if(dist0 > dist3) {
                    // triangle1
                    //sumDist = dist1 + dist2 + dist3;
                    //sumDistOther = (10 - dist1) + (10 - dist2) + (10 - dist3);

                    
                    //percDistB = (10 - dist1) / sumDistOther;
                    //percDistC = (10 - dist2) / sumDistOther;
                    //percDistD = (10 - dist3) / sumDistOther;


                    // y = (vert1.y * percDistB) + (vert2.y * percDistC) + (vert3.y * percDistD) + (o.height / 2);

                    y = getY(vert1, vert2, vert3, x, z);
                    //console.log("TRIANGLE 1", percDistB, percDistC, percDistD);

                } else {
                    // triangle2
                    //sumDist = dist0 + dist1 + dist2;
                    //sumDistOther = (10 - dist0) + (10 - dist1) + (10 - dist2);

                    //percDistA = (10 - dist0)/ sumDistOther;
                    //percDistB = (10 - dist1) / sumDistOther;
                    //percDistC = (10 - dist2) / sumDistOther;

                    //y = (vert0.y * percDistA) + (vert1.y * percDistB) + (vert2.y * percDistC) + (o.height / 2);
                    

                    y = getY(vert0, vert1, vert2, x, z);
                    //console.log("TRIANGLE 2", percDistA, percDistB, percDistC);



                }

                if(this.currentIndex !== xIndex) {
                    this.currentIndex = xIndex;
                }

                o.y = y;




                /*
                for(let x = 0; x < this.world.cellsX + 1; x++) {
                    for(let z = 0; z < this.world.cellsZ + 1; z++) {
                        const arrIndex = (x * (this.world.cellsZ + 1)) + z;
                        vertices[arrIndex * 3 + 1] = app.world.heightData.at(arrIndex);
                        arr.push(arrIndex);
                    }
                }
                */

                //
                // x = 
                /*
                if(o.goingDown) {
                    o.y -= 0.1;
                    if(o.y < 0) {
                        o.goingDown = false;
                    }
                } else {
                    o.y += 0.1;
                    if(o.y > 30) {
                        o.goingDown = true;
                    }
                }
                */
                //console.log(o.x, o.y, o.z);
            }

            resolve();

        });
    }

    buildTerrain() {

        const width = World.cellsX;
        const depth = World.cellsZ;

        const size = (width + 1) * (depth + 1);

        const hd = new Array(size);
        hd.fill(0);

        const perlin = new ImprovedNoise()

        const r = Math.random() * 100;

        let quality = 3;

        for(let n = 0; n < 3; n++) {
            for(let x = 0; x < width + 1; x++) {
                for(let z = 0; z < depth + 1; z++) {
                    const arrIndex = (x * (depth + 1)) + z;
    
                    const d = hd[arrIndex];

                    const val = d + Math.abs( perlin.noise( z / quality, x / quality, r ) * quality * 1.2);
    
    
                    hd[arrIndex] = val;
                    //vertices[arrIndex * 3 + 1] = app.world.heightData.at(arrIndex);
                    //arr.push(arrIndex);
                }
            }

            quality *= 5;
        }

        const heightDataArray = Buffifier.createInstance(BufferedArray, {
            of: DataTypes.Uint8,
            length: size
        }, {
            workingSpace: size
        });

        for(let n = 0; n < hd.length; n++) {
            heightDataArray.set(n, Math.round(hd[n]));
        }

        this.heightData = hd;

        this.app.world.heightData = heightDataArray;

    }
    
}









