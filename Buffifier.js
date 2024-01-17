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

export class ArrayObject {

    get #workingSpaceIndex() {
        return this._b + 1 + 2 + 1; // Uint8 + Uint16 + 1
    }
    get #ofBytes() {
        return Buffifier.getTypeBytes(this.of);
    }
    at(index) {
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


export class DataType {

    referenceType = null;

    bytes = null;

    type = null;

    name = null;

    createInstance() {
        if(this.referenceType) {
            return new globalThis[this.name]();
        } else {
            throw new Error("Can only create instances for reference types.");
        }
    }
    constructor(dataType, name) {
        this.type = dataType;
        this.name = name;
        this.referenceType = dataType > 11;

        if((dataType > 5 && dataType < 9) || dataType > 11) {
            this.bytes = 4;
        } else if(dataType === 4 || dataType === 5) {
            this.bytes = 2;
        } else if(dataType < 4) {
            this.bytes = 1;
        } else if(dataType > 8 && dataType < 12) {
            this.bytes = 8;
        } else {
            throw new Error("Unknown dataType");
        }
    }
}


export class Buffifier {
    


    static config = {
        ArrayObject: {
            of: DataTypes.Uint8,
            length: DataTypes.Uint16
        },
        State: {
            rootEntity: DataTypes.Entity,
            mouseX: DataTypes.Uint16,
            mouseY: DataTypes.Uint16
        },
        Entity: {
            parent: DataTypes.Entity,
            children: DataTypes.ArrayObject,
            x: DataTypes.Float64,
            y: DataTypes.Float64,
            radius: DataTypes.Float32
        }
    };
    

    static buffer = null;

    static dataView = null;

    static typesArrays = null;

    static int8Array = null;
    static uint8Array = null;

    static int16Array = null;
    static uint16Array = null;

    static int32Array = null;
    static uint32Array = null;
    
    static float32Array = null;
    static float64Array = null;

    static bigint64Array = null;
    static biguint64Array = null;

    static metaDataByteLength = 8; // First 4 bytes for next free block index (must be a multiple of 8)

    static cache = {
        dataTypesLookup: null,
        configLookup: null,
        objectLookup: null
    };

    // For float to int conversions
    static scratchBuffer = null;
    static scratchFloat32Arr = null;
    static scratchFloat64Arr = null;
    static scratchUint32Array = null;
    static scratchUint64Array = null;

    static init(sharedArrayBuffer, options) {

        const workingOptions = Object.assign({
            allocate: 100000000 // allocates 100 MB for use (has to be evenly divisible by 4, cause uint32array)
        }, options);

        // if given, use sharedArrayBuffer, else create new shared buffer array
        this.buffer = (sharedArrayBuffer === undefined ? new SharedArrayBuffer(workingOptions.allocate) : sharedArrayBuffer);

        this.int8Array = new Int8Array(this.buffer);
        this.uint8Array = new Uint8Array(this.buffer);

        this.int16Array = new Int16Array(this.buffer);
        this.uint16Array = new Uint16Array(this.buffer);

        this.int32Array = new Int32Array(this.buffer);
        this.uint32Array = new Uint32Array(this.buffer);

        this.float32Array = new Float32Array(this.buffer);
        this.float64Array = new Float64Array(this.buffer);

        this.bigint64Array = new BigInt64Array(this.buffer);
        this.biguint64Array = new BigUint64Array(this.buffer);
        

        this.dataView = new DataView(this.buffer);



        this.scratchBuffer = new ArrayBuffer(8);
        this.scratchFloat32Arr = new Float32Array(this.scratchBuffer);
        this.scratchFloat64Arr = new Float64Array(this.scratchBuffer);
        this.scratchUint32Array = new Uint32Array(this.scratchBuffer);
        this.scratchUint64Array = new BigUint64Array(this.scratchBuffer);


        // stores various things for quicker lookup
        this.cache.dataTypesLookup = new Array(Object.keys(DataTypes).length),
        this.cache.configLookup = new Array(Object.keys(this.config).length);
        this.cache.objectLookup = new Array(this.buffer.byteLength);

        const objectMetaBytes = 5; // first 4 bytes is a lock/unlock, fifth byte is the type

        const sortedDataTypes = Object.entries(DataTypes).sort((a, b) => {
            if (a[1] < b[1]) { return -1; }
            if (a[1] > b[1]) { return 1; }
            throw new Error("Expected unique values on sort.");
        });

        for(const [k, v] of sortedDataTypes) {
            this.cache.dataTypesLookup[v] = new DataType(v, k);
        }

        for (const [key, val] of Object.entries(this.config)) {

            const n = DataTypes[key];

            this.cache.configLookup[n] = {
                type: this.cache.dataTypesLookup[n],
                allocate: objectMetaBytes,
                propsLookup: [],
                props: {}
            };

            const sortedProps = Object.entries(val).sort((a, b) => {
                if (a[0] < b[0]) { return -1; }
                if (a[0] > b[0]) { return 1; }
                throw new Error("Expected unique prop names on sort.");
            });

            for(const [k, v] of sortedProps) {

                const additionalOffset = this.computeAdditionalOffset(this.cache.configLookup[n].allocate, this.cache.dataTypesLookup[v]);

                this.cache.configLookup[n].props[k] = {
                    offset: this.cache.configLookup[n].allocate + additionalOffset,
                    type: this.cache.dataTypesLookup[v]
                };
                this.cache.configLookup[n].allocate += additionalOffset + this.cache.dataTypesLookup[v].bytes;
                this.cache.configLookup[n].propsLookup.push(k);
            }

        }

        if(sharedArrayBuffer === undefined) {
            // mark first block as free block
            Atomics.store(this.uint32Array, 0, this.metaDataByteLength);
        }

    }

    static float32ToUint32(n) {

        
        Buffifier.scratchFloat32Arr[0] = n;

        const res = Buffifier.scratchUint32Array[0];

        return res;

    }

    static uint32ToFloat32(n) {


        Buffifier.scratchUint32Array[0] = n;

        const res = Buffifier.scratchFloat32Arr[0];

        return res;

    }


    static float64ToUint64(n) {

        Buffifier.scratchFloat64Arr[0] = n;

        const res = Buffifier.scratchUint64Array[0];

        return res;

    }

    static uint64ToFloat64(n) {

        Buffifier.scratchUint64Array[0] = n;

        const res = Buffifier.scratchFloat64Arr[0];

        return res;

    }

    static computeAdditionalOffset(currentBytesOffset, type) {

        const remainder = currentBytesOffset % type.bytes;

        return remainder === 0 ? remainder : (type.bytes - remainder);
    }

    static reserveFreeBlock(allocate) {


        // The value of the Uint32 at the zero index must be a multiple of 8.
        // Round up 'allocate' so it's a multiple of 8.

        // This is needed so we can properly set the offsets for the object properties.
        // We can now assume that all objects will start at an index that is a multiple of 8.

        const remainder = allocate % 8;

        // Atomics.add() returns the old value before addition.
        // That value is the next free block index.
        return Atomics.add(this.uint32Array, 0, allocate + (8 - remainder));
    }

    static buildObjectFromIndex(index) {

        const typeByte = this.dataView.getUint8(index);

        const obj = new globalThis[this.typesLookup[typeByte]]();

        this.postProcessObject(obj, this.typesLookup[typeByte], index);

        return obj;

    }

    static postProcessObject(obj, name, index) {

        Object.defineProperty(obj, "_b", {
            value: index,
            writable: false,
            enumerable: false,
            configurable: false
        });

        this.setGettersSetters(obj, name);
    }

    static getObjectAtIndex(index) {

        
        if(this.objectLookup[index] === undefined) {
            this.objectLookup[index] = this.buildObjectFromIndex(index);
        }

        return this.objectLookup[index];
    }


    static defineObjectProp(o, prop) {

        const propTypeName = o.buffifier.props[prop].type.name;
        const bytes = o.buffifier.props[prop].type.bytes;
        const objectIndex = o.buffifier.index;
        const offset = o.buffifier.props[prop].offset;
        const referenceType = o.buffifier.props[prop].type.referenceType;

        const typedArrayValueIndex = (objectIndex + offset) / bytes;

        const typedArrayLockIndex = o.buffifier.index / bytes;

        let typedArray = referenceType ? this.uint32Array : this[propTypeName.toLowerCase() + "Array"];

        let getTransform = (num) => {
            return num;
        };

        let setTransform = (num) => {
            return num;
        };


        if(propTypeName === "Float32") {
            typedArray = this.uint32Array;
            getTransform = this.uint32ToFloat32;
            setTransform = this.float32ToUint32;
        } else if(propTypeName === "Float64"){
            typedArray = this.biguint64Array;
            getTransform = this.uint64ToFloat64;
            setTransform = this.float64ToUint64;
        }

        Object.defineProperty(o, prop, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {
                async get() {
                    return new Promise((resolve) => {

                        const f = (r) => {

                            if(referenceType){
                        
                                const index = Atomics.load(typedArray, typedArrayValueIndex);
            
                                resolve(index === 0 ? null : 666); //Buffifier.getObjectAtIndex(index);
            
                            } else {

                                resolve(getTransform(Atomics.load(typedArray, typedArrayValueIndex)));

                            }
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

                        const f = (r) => {

                            if(referenceType){

                                Atomics.store(typedArray, typedArrayValueIndex, v.buffifier.index);

                            } else {

                                Atomics.store(typedArray, typedArrayValueIndex, setTransform(v));

                            }

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

            if (Atomics.compareExchange(Buffifier.int32Array, this.buffifier.index / 4, 1, 2) !== 1) {
                // Promise apparently is never rejected according to MDN docs.
                Atomics.waitAsync(Buffifier.int32Array, this.buffifier.index / 4, 2, 2000).value.then((o) => {
                    resolve(o);
                });
            } else {
                resolve("not locked");
            }
        });
    }

    static unlockObject() {
        // 'this' is the object, not Buffifier

        if (Atomics.compareExchange(Buffifier.int32Array, this.buffifier.index / 4, 2, 1) !== 2) {
            throw new Error("Trying to unlock an already unlocked object");
        }
        Atomics.notify(Buffifier.int32Array, this.buffifier.index / 4, 1);
    }

    static createObject(type, options) {

        const workingOptions = Object.assign({
            workingSpace: 0
        }, options);

        const config = this.cache.configLookup[type];

        const objectBlockIndex = this.reserveFreeBlock(config.allocate + workingOptions.workingSpace);

        // since no thread at this point knows about objectBlockIndex except right here... 
        // ... so we should be good to write at that location without issue

        // objectBlockIndex is a multiple of 4 so hoping dividing by 4 gives an integer

        this.int32Array[objectBlockIndex / 4] = 1; // mark as unlocked

        this.uint8Array[objectBlockIndex + 4] = type; // add type byte

        // create vanilla instance
        const instance = config.type.createInstance();

        // construct buffifier object...

        const buffifier = {
            index: objectBlockIndex,
            props: config.props,
            lock: this.lockObject.bind(instance),
            unlock: this.unlockObject.bind(instance),

        };

        if(workingOptions.workingSpace !== 0) {
            buffifier.workingSpaceIndex = objectBlockIndex + workingOptions.workingSpace;
        }

        Object.defineProperty(instance, "buffifier", {
            value: buffifier,
            writable: false,
            enumerable: false,
            configurable: false
        });

        for(const propName of config.propsLookup){
            this.defineObjectProp(instance, propName);
        }

        return instance;

    }


}
