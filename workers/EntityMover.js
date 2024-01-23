export class EntityMoverWorker {

    state = null;

    world = null;

    worldItems = null;

    init = async (state, config) => {
        
        return new Promise(async (resolve) => {

            console.log("EntityMoverWorker init", state, config);
            
            this.state = state;

            this.world = state.world;

            this.worldItems = this.world.items;

            resolve();

        });
    }

    work = async () => {
        return new Promise(async (resolve) => {

            /*
            let t = 0;

            for(let m = 0; m < 100; m++) {

                for(let n = 0; n < 1000; n++) {
                    const ent = await this.worldItems.get(n);
                    t = (m + n) / 3;
                    
                }

            }
            */

            
            //const itemsLength =;

            
            //for(let m = 0; m < 4; m++) {

                
                for(let n = 0; n <  this.worldItems.length; n++) {
                    //const k = await this.worldItems.length;
                    const ent = this.worldItems.get(n);

                    // random movements for now

                    //let x = ent.x;
                    //let z = ent.z;

                    ent.x = ent.x + 0.1;
                    ent.y = ent.y + 0.1;
                    ent.z = ent.z + 0.1;

                    //ent.x = x;
                    //ent.z = z;

                }
                
            //}
            
            resolve();

        });
    }
    
}









