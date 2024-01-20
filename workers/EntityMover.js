export class EntityMoverWorker {

    state = null;

    world = null;

    worldItems = null;

    async init(state, config) {
        console.log("EntityMoverWorker init", state, config);
        return new Promise(async (resolve) => {

            this.state = state;

            this.world = await state.world.get();

            this.worldItems = await this.world.items.get();

            resolve();

        });
    }

    async work() {
        return new Promise(async (resolve) => {
            console.log("EntityMoverWorker work");
            
            const itemsLength = await this.worldItems.length.get();

            for(let n = 0; n < itemsLength; n++) {
                const ent = await this.worldItems.get(n);
                // random movements for now

                let x = await ent.x.get();
                let z = await ent.z.get();

                x = x + (Math.random() - 0.5);
                z = z + (Math.random() - 0.5);

                await ent.x.set(x);
                await ent.z.set(z);
            }

            resolve();

        });
    }
    
}









