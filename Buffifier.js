export const DataTypes = {
    null: 0,
    boolean: 1,
    Int8: 2,
    Uint8: 3,
    Int16: 4,
    Uint16: 5,
    Int32: 6,
    Uint32: 7,
    Float32: 8,
    Float64: 9,
    BigInt64: 10,
    BigUint64: 11,
    ArrayObject: 12,
    State: 13,
    Entity: 14
};

/*
export class ArrayObject {

    static _meta = {
        props: {
            of: DataTypes.Uint8,
            length: DataTypes.Uint16
        }
    };

    get #workingSpaceIndex() {
        return this._b.index + this._b.meta.allocate;
    }
    at(index) {

        const ofType = Buffifier.cache.typesLookup[this.of.get()];

        const typedArrayValueIndex = (this._b + offset) / ofType.bytes;


        if(Buffifier.isReferenceType(this.of)) {
            const n = Buffifier.rawGet(Buffifier.types.Uint32, this.#workingSpaceIndex + (this.#ofBytes * index))
            return Buffifier.getObjectAtIndex(n);
        } else {
            return Buffifier.rawGet(this.of, this.#workingSpaceIndex + (this.#ofBytes * index))
        }
    }
    push(v) {

        // assume v is good for this array

        // need some sort of atomics here...

        const n = this.#workingSpaceIndex + (this.#ofBytes * this.length);

        if(Buffifier.isReferenceType(this.of)) {
            // assume v is already buffified
            Buffifier.rawSet(Buffifier.types.Uint32, n, v._b);
        } else {
            Buffifier.rawSet(this.of, n, v);
        }

        return ++this.length;
        
    }

    toArray() {

        const res = [];

        for(let n = 0; n < this.length; n++) {
            res.push(this.at(n));
        }

        return res;

    }


}
*/

export class DataType {

    typeByte = null;

    name = null;

    bytes = null;

    referenceType = null;

    typedArray = null;

    setTranform = (n) => {
        return n;
    }

    getTranform = (n) => {
        return n;
    }

    constructor(typeByte, name) {

        this.typeByte = typeByte;
        this.name = name;
        this.referenceType = typeByte > 11;

        if((typeByte > 5 && typeByte < 9) || typeByte > 11) {
            this.bytes = 4;
        } else if(typeByte === 4 || typeByte === 5) {
            this.bytes = 2;
        } else if(typeByte < 4) {
            this.bytes = 1;
        } else if(typeByte > 8 && typeByte < 12) {
            this.bytes = 8;
        } else {
            throw new Error("Unknown typeByte");
        }

        if(this.typeByte === 2) {
            this.typedArray = Buffifier.int8Array;
        } else if(this.typeByte === 3) {
            this.typedArray = Buffifier.uint8Array;
        } else if(this.typeByte === 4) {
            this.typedArray = Buffifier.int16Array;
        } else if(this.typeByte === 5) {
            this.typedArray = Buffifier.uint16Array;
        } else if(this.typeByte === 6) {
            this.typedArray = Buffifier.int32Array;
        } else if(this.typeByte === 7) {
            this.typedArray = Buffifier.uint32Array;
        } else if(this.typeByte === 8) {
            // float32 goes in uint32
            this.typedArray = Buffifier.uint32Array;
            this.getTransform = Buffifier.typeConverter.uint32ToFloat32;
            this.setTransform = Buffifier.typeConverter.float32ToUint32;
        } else if(this.typeByte === 9) {
            // float64 goes in biguint64
            this.typedArray = Buffifier.biguint64Array;
            this.getTransform = Buffifier.typeConverter.uint64ToFloat64;
            this.setTransform = Buffifier.typeConverter.float64ToUint64;
        } else if(this.typeByte === 10) {
            this.typedArray = Buffifier.bigint64Array;
        } else if(this.typeByte === 11) {
            this.typedArray = Buffifier.biguint64Array;
        } else if(this.typeByte > 11) {
            // reference objects
            this.typedArray = Buffifier.uint32Array;
        }
    }
}

export class TypeConverter {

    buffer = null;

    float32Arr = null;
    float64Arr = null;

    uint32Array = null;
    uint64Array = null;

    constructor() {
        
        this.buffer = new ArrayBuffer(8);

        this.float32Arr = new Float32Array(this.buffer);
        this.float64Arr = new Float64Array(this.buffer);
        this.uint32Array = new Uint32Array(this.buffer);
        this.uint64Array = new BigUint64Array(this.buffer);

    }

    float32ToUint32 = (n) => {
        this.float32Arr[0] = n;
        return this.uint32Array[0];
    }

    uint32ToFloat32 = (n) => {
        this.uint32Array[0] = n;
        return this.float32Arr[0];
    }

    float64ToUint64 = (n) => {
        this.float64Arr[0] = n;
        return this.uint64Array[0];
    }

    uint64ToFloat64 = (n) => {
        this.uint64Array[0] = n;
        return this.float64Arr[0];
    }

}

export class Buffifier {

    static buffer = null;

    static typesArrays = null;

    static int8Array = null;
    static uint8Array = null;

    static int16Array = null;
    static uint16Array = null;

    static int32Array = null;
    static uint32Array = null;

    static bigint64Array = null;
    static biguint64Array = null;

    static metaDataByteLength = 8; // must be a multiple of 8 (First 4 bytes is for next free block index)

    static cache = {
        typesLookup: null,
        classLookup: null,
        instanceLookup: null
    };

    static init(classes, sharedArrayBuffer, options) {

        const workingOptions = Object.assign({
            allocate: 300000000 // allocates 300 MB for use (has to be evenly divisible by 8)
        }, options);

        this.typeConverter =  new TypeConverter();

        // if given, use sharedArrayBuffer, else create new shared buffer array
        this.buffer = (!sharedArrayBuffer ? new SharedArrayBuffer(workingOptions.allocate) : sharedArrayBuffer);

        // create all the typed arrays with the same underlying buffer
        this.int8Array = new Int8Array(this.buffer);
        this.uint8Array = new Uint8Array(this.buffer);

        this.int16Array = new Int16Array(this.buffer);
        this.uint16Array = new Uint16Array(this.buffer);

        this.int32Array = new Int32Array(this.buffer);
        this.uint32Array = new Uint32Array(this.buffer);

        this.bigint64Array = new BigInt64Array(this.buffer);
        this.biguint64Array = new BigUint64Array(this.buffer);

        const dataTypesCount = Object.keys(DataTypes).length;

        // stores DataType instances in an array indexed by type byte
        this.cache.typesLookup = new Array(dataTypesCount),

        // stores instances of objects that are backed by the buffer...
        // ... indexed by the objects location (index) in the buffer
        this.cache.instanceLookup = new Array(this.buffer.byteLength);

        // stores classes so instances can be created when just having the type byte
        this.cache.classLookup = new Array(dataTypesCount);

        const objectMetaBytes = 5; // first 4 bytes is a lock/unlock, fifth byte is the type

        const sortedDataTypes = Object.entries(DataTypes).sort((a, b) => {
            if (a[1] < b[1]) { return -1; }
            if (a[1] > b[1]) { return 1; }
            throw new Error("Expected unique values on sort.");
        });

        for (const [k, v] of sortedDataTypes) {
            this.cache.typesLookup[v] = new DataType(v, k);
        }

        for (const cls of classes) {

            const typeByte = DataTypes[cls.name];

            this.cache.classLookup[typeByte] = cls;
            
            const meta = cls._meta;

            meta.type = this.cache.typesLookup[typeByte];

            // allocate gets incremented later
            meta.allocate = objectMetaBytes;

            // stores prop names
            meta.propsLookup = [];

            // stores details about each prop
            meta.propsComputed = {};

            // sorts props by prop name so order is consistant
            const sortedProps = Object.entries(meta.props).sort((a, b) => {
                if (a[0] < b[0]) { return -1; }
                if (a[0] > b[0]) { return 1; }
                throw new Error("Expected unique prop names on sort.");
            });

            for(const [k, v] of sortedProps) {

                const type = this.cache.typesLookup[v];
                
                // needed so the prop is aligned to fit in its corresponding typed array
                const additionalOffset = this.computeAdditionalOffset(meta.allocate, type);


                meta.propsComputed[k] = {
                    offset: meta.allocate + additionalOffset,

                    type: type
                };

                meta.allocate += additionalOffset + type.bytes;

                meta.propsLookup.push(k);

            }

        }

        // if this thread is the main thread
        if(!sharedArrayBuffer) {

            // mark first block as free block
            Atomics.store(this.uint32Array, 0, this.metaDataByteLength);

        }

    }

    // rounds up so the type can be accessed with its corresponding typed array
    static computeAdditionalOffset(currentBytesOffset, type) {

        const remainder = currentBytesOffset % type.bytes;

        return remainder === 0 ? remainder : (type.bytes - remainder);

    }

    static reserveFreeBlock(allocate) {

        // Round up 'allocate' so it's a multiple of 8.

        // This is needed so we can properly set the offsets for the object properties.
        // We can now assume that all objects will start at an index that is a multiple of 8.
        const remainder = allocate % 8;

        // Atomics.add() returns the old value before addition.
        // That value is the next free block index.
        return Atomics.add(this.uint32Array, 0, allocate + (8 - remainder));

    }

    static newInstanceFromIndex(index) {

        // do we even need atomics here?
        const typeByte = Atomics.load(this.uint8Array, index + 4);

        const cls = this.cache.classLookup[typeByte];
        
        const instance = new cls();

        this.configureInstance(instance, index, cls._meta);

        return instance;

    }

    static getInstance(index) {

        if(this.cache.instanceLookup[index] === undefined) {
            this.cache.instanceLookup[index] = this.newInstanceFromIndex(index);
        }

        return this.cache.instanceLookup[index];
    }

    static getRaw(type, typedArrayValueIndex) {

        if(type.referenceType){
                        
            const index = Atomics.load(type.typedArray, typedArrayValueIndex);

            return (index === 0 ? null : Buffifier.getInstance(index));

        } else {

            return (type.getTransform(Atomics.load(type.typedArray, typedArrayValueIndex)));

        }
    }
    static setRaw(v, type, typedArrayValueIndex) {

        if(type.referenceType){

            if(v === null) {

                Atomics.store(type.typedArray, typedArrayValueIndex, 0);

            } else {

                Atomics.store(type.typedArray, typedArrayValueIndex, v._b.index);

            }
            
        } else {

            Atomics.store(type.typedArray, typedArrayValueIndex, type.setTransform(v));

        }

    }
    static defineObjectProp(o, prop) {

        const props = o._b.meta.propsComputed;

        const objectIndex = o._b.index;

        const offset = props[prop].offset;

        const type = props[prop].type;

        const typedArrayValueIndex = (objectIndex + offset) / type.bytes;

        const typedArrayLockIndex = o._b.index / type.bytes;


        Object.defineProperty(o, prop, {
            enumerable: true,
            value: {
                async get() {
                    return new Promise((resolve) => {

                        const f = () => {


                            resolve(Buffifier.getRaw(type, typedArrayValueIndex));
                            /*
                            if(referenceType){
                        
                                const index = Atomics.load(typedArray, typedArrayValueIndex);
            
                                resolve(index === 0 ? null : Buffifier.getInstance(index));
            
                            } else {

                                resolve(getTransform(Atomics.load(typedArray, typedArrayValueIndex)));

                            }
                            */
                        };
    
                        const p = Atomics.waitAsync(Buffifier.int32Array, typedArrayLockIndex, 2, 2000);
    
                        if(p.async) {
                            p.value.then(f);
                        } else {
                            f("not async, not locked");
                        }
                        
                    });
                },
                async set(v) {
                    return new Promise((resolve) => {

                        const f = () => {

                            Buffifier.setRaw(v, type, typedArrayValueIndex);

                            /*
                            if(referenceType){

                                if(v === null) {

                                    Atomics.store(typedArray, typedArrayValueIndex, 0);

                                } else {

                                    Atomics.store(typedArray, typedArrayValueIndex, v._b.index);

                                }
                                
                                
                            } else {

                                Atomics.store(typedArray, typedArrayValueIndex, setTransform(v));

                            }
                            */

                            resolve();

                        }
        
                        const p = Atomics.waitAsync(Buffifier.int32Array, typedArrayLockIndex, 2, 2000);
        
                        if(p.async) {
                            p.value.then(f);
                        } else {
                            f("not async, not locked");
                        }

                    });
                }
            }
        });

    }

    static async lockObject() {
        return new Promise((resolve) => {
            // 'this' is the object, not Buffifier

            if (Atomics.compareExchange(Buffifier.int32Array, this._b.index / 4, 1, 2) !== 1) {
                // Promise apparently is never rejected according to MDN docs.
                Atomics.waitAsync(Buffifier.int32Array, this._b.index / 4, 2, 2000).value.then((o) => {
                    resolve(o);
                });
            } else {
                resolve("not locked");
            }
        });
    }

    static unlockObject() {
        // 'this' is the object, not Buffifier

        if (Atomics.compareExchange(Buffifier.int32Array, this._b.index / 4, 2, 1) !== 2) {
            throw new Error("Trying to unlock an already unlocked object");
        }

        Atomics.notify(Buffifier.int32Array, this._b.index / 4, 1);

    }

    static configureInstance(instance, index, meta) {

        // construct helper object...
        const _b = {
            index: index,
            meta: meta,
            lock: this.lockObject.bind(instance),
            unlock: this.unlockObject.bind(instance),
        };

        Object.defineProperty(instance, "_b", {
            value: _b,
            writable: false,
            enumerable: false,
            configurable: false
        });

        for(const propName of meta.propsLookup){
            this.defineObjectProp(instance, propName);
        }

    }

    static createObject(cls, values, options) {

        const workingOptions = Object.assign({
            workingSpace: 100000 * 4 // 0.4 MB of space for the array ()
        }, options);

        const meta = cls._meta;

        const objectBlockIndex = this.reserveFreeBlock(meta.allocate + workingOptions.workingSpace);

        // since no thread at this point knows about objectBlockIndex except right here... 
        // ... so we should be good to write at that location without issue

        // objectBlockIndex is a multiple of 4 so hoping dividing by 4 gives an integer

        this.int32Array[objectBlockIndex / 4] = 1; // mark as unlocked

        this.uint8Array[objectBlockIndex + 4] = meta.type.typeByte; // add type byte

        // create vanilla instance
        const instance = new cls();

        this.configureInstance(instance, objectBlockIndex, meta);

        if(!!values) {
            // set any initial values
            for (const [key, val] of Object.entries(values)) {
                // no need for respecting the lock here, but it does anyway
                instance[key].set(val);
            }
        }

        return instance;

    }

}
