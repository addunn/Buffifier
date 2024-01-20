export class EntityZSetterWorker {

    state = null;

    async init(state, config) {
        return new Promise(async (resolve) => {
            console.log("EntityZSetterWorker init", state, config);
            this.state = state;
            resolve();
        });
    }

    async work() {
        return new Promise((resolve) => {
            console.log("EntityZSetterWorker work");
            resolve();
        });
    }

    
}









