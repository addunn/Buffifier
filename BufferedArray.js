import { MemorySystem, DataTypes } from "./Buffifier.js";

export class BufferedArray {

    static _meta = {
        get props() {
            return {
                of: DataTypes.Uint8,
                length: DataTypes.Uint32
            }
        }
    };
    

    #workingSpaceIndex = null;

    #workingSpaceTypedZeroIndex = null;

    

    #ofType = null;

    #lengthType = null;

    #lengthTypedArrayIndex = null;


/*
    [Symbol.iterator]() {

        // Use a new index for each iterator. This makes multiple
        // iterations over the iterable safe for non-trivial cases,
        // such as use of break or nested looping over the same iterable.
        let index = 0;

        return {
            // Note: using an arrow function allows `this` to point to the
            // one of `[@@iterator]()` instead of `next()`
            next: () => {
                if (index < this.#data.length) {
                    return { 
                        value: this.#data[index++], 
                        done: false 
                    };
                } else {
                    return { 
                        done: true 
                    };
                }
            },
        };

    }
*/

    onCreatedInstance() {

        const ofProp = this._b.meta.propsComputed.of;

        const ofTypedArrayIndex = (this._b.index + ofProp.offset) / ofProp.type.bytes;

        const ofVal = Atomics.load(ofProp.type.typedArray, ofTypedArrayIndex);

        this.#ofType = MemorySystem.cache.typesLookup[ofVal];

        const currentWorkingSpaceIndex = this._b.index + this._b.meta.allocate;

        const remainder = (this._b.index + this._b.meta.allocate) % this.#ofType.bytes;

        const additionalOffset = remainder === 0 ? remainder : (this.#ofType.bytes - remainder);

        this.#workingSpaceIndex = currentWorkingSpaceIndex + additionalOffset;

        this.#workingSpaceTypedZeroIndex = this.#workingSpaceIndex / this.#ofType.bytes;
        
        const lengthProp = this._b.meta.propsComputed.length;

        this.#lengthType = lengthProp.type;

        this.#lengthTypedArrayIndex = (this._b.index + lengthProp.offset) / lengthProp.type.bytes;

    }

    getUBoundIndex() {
        let workingSpace = 0;

        if(this._b.options !== null) {
            workingSpace = this._b.options.workingSpace;
        }

        return this.#workingSpaceIndex + workingSpace;

    }

    get(index) {

        return MemorySystem.getInstance(Atomics.load(this.#ofType.typedArray, this.#workingSpaceTypedZeroIndex + index));

    }
    
    async push(v) {

        return new Promise((resolve) => {

            this._b.lock().then(() => {

                const length = Atomics.add(this.#lengthType.typedArray, this.#lengthTypedArrayIndex, 1) + 1;

                MemorySystem.setRaw(v, this.#ofType, (this.#workingSpaceTypedZeroIndex + length - 1))

                resolve(length);

                this._b.unlock();
            });

        });

    }

    async toUnbufferedArray() {

        return new Promise(async (resolve) => {

            await this._b.lock();

            const length = Atomics.load(this.#lengthType.typedArray, this.#lengthTypedArrayIndex);

            const res = [];

            for(let n = 0; n < length; n++) {
                res.push(this.get(n));
            }

            resolve(res);

            this._b.unlock();

        });
    }

}

