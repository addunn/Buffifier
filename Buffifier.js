
import { MainThread } from "./threads/Main.js";
import { RendererThread } from "./threads/Renderer.js";
import { EntityThread } from "./threads/Entity.js";
import { TerrainThread } from "./threads/Terrain.js";
import { PathingThread } from "./threads/Pathing.js";


import { App } from "./App.js";
import { World } from "./World.js";
import { Entity } from "./Entity.js";



const config = {
    classes: [
        App,
        World,
        Entity
    ],
    threads: {
        main: [ 
            // only one main thread class currently supported
            MainThread 
        ],
        canvas: [ 
            // only one canvas thread class currently supported
            RendererThread
        ],
        others: [
            EntityThread, 
            TerrainThread,
            PathingThread
        ]
    }
};

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
    BufferedArray: 12
    // classes from config automatically added here
    
}



export class BufferedArray {

    constructor() {

        Object.defineProperty(this, "_a", {
            value: {},
            writable: false,
            enumerable: false,
            configurable: false
        });

    }

    static _meta = {
        get props() {
            return {
                of: DataTypes.Uint8,
                length: DataTypes.Uint32
            }
        }
    };
    
    getReferenceType(index) {
        return MemorySystem.getReferenceType(this._a.ofType, this._a.typedZeroIndex + index);
    }

    getPrimitiveType(index) {
        return MemorySystem.getPrimitiveType(this._a.ofType, this._a.typedZeroIndex + index);
    }

    setReferenceType(index, v) {
        return MemorySystem.setReferenceType(v, this._a.ofType, this._a.typedZeroIndex + index);
    }

    setPrimitiveType(index, v) {
        return MemorySystem.setPrimitiveType(v, this._a.ofType, this._a.typedZeroIndex + index);
    }

    [Symbol.iterator]() {

        let index = 0;

        return {
            next: () => {
                if (index < this.length) {
                    return { 
                        value: this.at(index++), 
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

    onCreatedInstance() {


        const ofProp = this._b.meta.propsComputed.of;

        const ofTypedArrayIndex = (this._b.index + ofProp.offset) / ofProp.type.bytes;

        const ofVal = Atomics.load(ofProp.type.typedArray, ofTypedArrayIndex);

        this._a.ofType = MemorySystem.cache.typesLookup[ofVal];
        
        const currentWorkingSpaceIndex = this._b.index + this._b.meta.allocate;

        const remainder = (this._b.index + this._b.meta.allocate) % this._a.ofType.bytes;

        const additionalOffset = remainder === 0 ? remainder : (this._a.ofType.bytes - remainder);

        const workingSpaceIndex = currentWorkingSpaceIndex + additionalOffset;

        this._a.typedZeroIndex = workingSpaceIndex / this._a.ofType.bytes;
        
        const lengthProp = this._b.meta.propsComputed.length;

        this._a.lengthType = lengthProp.type;

        this._a.lengthTypedArrayIndex = (this._b.index + lengthProp.offset) / lengthProp.type.bytes;

        if(this._a.ofType.referenceType) {
            this.at = this.getReferenceType;
            this.set = this.setReferenceType;
        } else {
            this.at = this.getPrimitiveType;
            this.set = this.setPrimitiveType;
        }
    }
    
    at = () => undefined;

    set = () => undefined;

    push(v) {


        const length = Atomics.add(this._a.lengthType.typedArray, this._a.lengthTypedArrayIndex, 1) + 1;

        MemorySystem.setRaw(v, this._a.ofType, (this._a.typedZeroIndex + length - 1))

        return length;

    }

}


class DataType {

    typeByte = null;

    bytes = null;

    referenceType = null;

    typedArray = null;

    setTransform = (n) => {
        return n;
    }

    getTransform = (n) => {
        return n;
    }

    constructor(typeByte) {

        this.typeByte = typeByte;

        this.referenceType = typeByte > 11;

        // set how many bytes needed to store the data type

        if((typeByte > 5 && typeByte < 9) || typeByte > 11) {
            this.bytes = 4;
        } else if(typeByte === 4 || typeByte === 5) {
            this.bytes = 2;
        } else if(typeByte < 4) {
            this.bytes = 1;
        } else if(typeByte > 8 && typeByte < 12) {
            this.bytes = 8;
        }

        // set the typed array used for storing the data type
        if(typeByte === 0) {
            this.typedArray = MemorySystem.uint8Array;
        } else if(typeByte === 1) {
            this.typedArray = MemorySystem.uint8Array;
            this.getTransform = TypeConverter.intToBool;
            this.setTransform = TypeConverter.boolToInt;
        } else if(typeByte === 2) {
            this.typedArray = MemorySystem.int8Array;
        } else if(typeByte === 3) {
            this.typedArray = MemorySystem.uint8Array;
        } else if(typeByte === 4) {
            this.typedArray = MemorySystem.int16Array;
        } else if(typeByte === 5) {
            this.typedArray = MemorySystem.uint16Array;
        } else if(typeByte === 6) {
            this.typedArray = MemorySystem.int32Array;
        } else if(typeByte === 7) {
            this.typedArray = MemorySystem.uint32Array;
        } else if(typeByte === 8) {
            // float32 goes in uint32
            this.typedArray = MemorySystem.uint32Array;
            this.getTransform = TypeConverter.uint32ToFloat32;
            this.setTransform = TypeConverter.float32ToUint32;
        } else if(typeByte === 9) {
            // float64 goes in biguint64
            this.typedArray = MemorySystem.biguint64Array;
            this.getTransform = TypeConverter.uint64ToFloat64;
            this.setTransform = TypeConverter.float64ToUint64;
        } else if(typeByte === 10) {
            this.typedArray = MemorySystem.bigint64Array;
        } else if(typeByte === 11) {
            this.typedArray = MemorySystem.biguint64Array;
        } else if(typeByte > 11) {
            // reference objects are uint32 because it holds 
            // the index of the object in the buffer
            this.typedArray = MemorySystem.uint32Array;
        }
    }
}

class TypeConverter {

    static buffer = new ArrayBuffer(8);

    static float32Arr = new Float32Array(this.buffer);
    static float64Arr = new Float64Array(this.buffer);

    static uint32Array = new Uint32Array(this.buffer);
    static uint64Array = new BigUint64Array(this.buffer);

    static float32ToUint32 = (n) => {
        this.float32Arr[0] = n;
        return this.uint32Array[0];
    }

    static uint32ToFloat32 = (n) => {
        this.uint32Array[0] = n;
        return this.float32Arr[0];
    }

    static float64ToUint64 = (n) => {
        this.float64Arr[0] = n;
        return this.uint64Array[0];
    }

    static uint64ToFloat64 = (n) => {
        this.uint64Array[0] = n;
        return this.float64Arr[0];
    }

    static boolToInt(b) {
        if(b) {
            return 1;
        } else {
            return 0;
        }
    }

    static intToBool(n) {
        return n !== 0;
    }

}


class MemorySystem {

    static buffer = null;

    static rootObject = null;

    static int8Array = null;
    static uint8Array = null;

    static int16Array = null;
    static uint16Array = null;

    static int32Array = null;
    static uint32Array = null;

    static bigint64Array = null;
    static biguint64Array = null;

    static metaDataIndices = {
        freeIndex: 0, // uint32
        bytesAllocated: 1, // uint32
        workersSignal: 2, // int32
    };

    static objectMetaDataIndicesOffset = {
        lock: 0, // int32
        type: 4, // uint8
        workingSpaceBytes: 2 // uint32
    };

    static cache = {
        typesLookup: null,
        classLookup: null,
        instanceLookup: null
    };

    static threadMetaDataBytes = 8;

    // [0-3] int32 locking/unlocking object
    // [4] uint8 type byte
    // [8-11] uint32 working space amount for variable sized objects (e.g., BufferedArray)
    static objectMetaDataBytes = 12; 

    // must be a multiple of 8 
    // [0-3] uint32 starting index of free space
    // [4-7] uint32 of total memory allocated in bytes
    // [8-11] int32 signal for workers
    static metaDataBytes = 16;

    static rootObjectIndex = null;

    static init(buffer) {

        // buffer is always a SharedArrayBuffer

        this.buffer = buffer;

        // create all typed arrays with the same underlying buffer

        this.int8Array = new Int8Array(this.buffer);
        this.uint8Array = new Uint8Array(this.buffer);

        this.int16Array = new Int16Array(this.buffer);
        this.uint16Array = new Uint16Array(this.buffer);

        this.int32Array = new Int32Array(this.buffer);
        this.uint32Array = new Uint32Array(this.buffer);

        this.bigint64Array = new BigInt64Array(this.buffer);
        this.biguint64Array = new BigUint64Array(this.buffer);

        // concat all classes to one array for processing...

        const classesToProcess = config.classes.slice();

        classesToProcess.push(
            BufferedArray,
            ...config.threads.main, 
            ...config.threads.canvas, 
            ...config.threads.others
        );

        classesToProcess.sort((a, b) => {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            throw new Error("Expected unique classes.");
        });

        console.log(classesToProcess);
        let dataTypesCount = Object.keys(DataTypes).length;

        // add custom classes to DataTypes
        for (const cls of classesToProcess) {
            DataTypes[cls.name] = dataTypesCount;
            dataTypesCount++;
        }

        // stores DataType instances in an array indexed by type byte
        this.cache.typesLookup = new Array(dataTypesCount);

        // stores classes so instances can be created when just having the type byte
        this.cache.classLookup = new Array(dataTypesCount);

        // stores instances of objects that are backed by the buffer...
        // ... indexed by the objects location (index) in the buffer
        this.cache.instanceLookup = new Map(); // new Array(this.buffer.byteLength);

        // sorting the entries by value because distrustful of consistent ordering
        const sortedDataTypes = Object.entries(DataTypes).sort((a, b) => {
            if (a[1] < b[1]) { return -1; }
            if (a[1] > b[1]) { return 1; }
            throw new Error("Expected unique values on sort.");
        });

        for (const [k, v] of sortedDataTypes) {
            this.cache.typesLookup[v] = new DataType(v, k);
        }

        for (const cls of classesToProcess) {

            const typeByte = DataTypes[cls.name];

            this.cache.classLookup[typeByte] = cls;
            
            const meta = cls._meta;

            meta.type = this.cache.typesLookup[typeByte];

            // allocate gets incremented later
            meta.allocate = this.objectMetaDataBytes;

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

        // rootObjectIndex is the first byte after meta data and thread meta data 
        this.rootObjectIndex = this.metaDataBytes + (ThreadSystem.totalThreads * this.threadMetaDataBytes);

        if(Buffifier.isMainThread) {
            
            // explicit here for clarity
            const freeIndex = this.rootObjectIndex;

            // Buffifier.rootObject hasn't been created yet, but set the 
            // freeIndex to the rootObjectIndex because the next 
            // memory object created will be the root object
            Atomics.store(this.uint32Array, this.metaDataIndices.freeIndex, freeIndex);

            // store how much buffer space we allocated for potential future use
            Atomics.store(this.uint32Array, this.metaDataIndices.bytesAllocated, this.buffer.byteLength);

        }

    }

    static createInstance(cls, values, options) {

        const workingOptions = Object.assign({
            workingSpace: 0
        }, options);

        const meta = cls._meta;

        const objectBlockIndex = this.reserveFreeBlock(meta.allocate + workingOptions.workingSpace);

        // since no thread at this point knows about objectBlockIndex except right here... 
        // ... so we should be good to write at that location without issue

        // objectBlockIndex is a multiple of 4 so hoping dividing by 4 gives an integer

        this.int32Array[(objectBlockIndex / 4) + this.objectMetaDataIndicesOffset.lock] = 1; // mark as unlocked

        this.uint8Array[objectBlockIndex + this.objectMetaDataIndicesOffset.type] = meta.type.typeByte; // add type byte

        this.uint32Array[(objectBlockIndex / 4) + this.objectMetaDataIndicesOffset.workingSpaceBytes ] = workingOptions.workingSpace; // add working space size

        // create vanilla instance
        const instance = new cls();

        this.configureInstance(instance, objectBlockIndex, meta, workingOptions);

        if(!!values) {
            // set any initial values
            for (const [key, val] of Object.entries(values)) {
                // prop can, but doesn't have to, point to a memory value
                instance[key] = val;
            }
        }

        if("onCreatedInstance" in instance) {
            instance.onCreatedInstance();
        }

        return instance;

    }

    static configureInstance(instance, index, meta, options) {

        // construct helper object...
        const _b = {
            index: index,
            lastByteIndex: index + meta.allocate + options.workingSpace - 1,
            blockSize: meta.allocate + options.workingSpace,
            meta: meta,
            options: options//,
            //lock: this.lockObject.bind(instance),
            //unlock: this.unlockObject.bind(instance),
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
        return Atomics.add(this.uint32Array, 0, (allocate + (8 - remainder)));

    }

    static newInstanceFromIndex(index) {

        // do we even need atomics here?
        // const typeByte = Atomics.load(this.uint8Array, index + 4);
        const typeByte = this.uint8Array[index + 4];

        // also do we need atomics here because working space should only be written once on object creation
        // const workingSpace = Atomics.load(this.uint32Array, (index + 8) / 4);
        const workingSpace = this.uint32Array[(index + 8) / 4];

        const cls = this.cache.classLookup[typeByte];
        
        const instance = new cls();

        this.configureInstance(instance, index, cls._meta, {
            workingSpace: workingSpace
        });

        if("onCreatedInstance" in instance) {
            instance.onCreatedInstance();
        }

        return instance;

    }

    static getInstance(index) {

        if(this.cache.instanceLookup.has(index)) {

            return this.cache.instanceLookup.get(index);
            
        } else {
            const o = this.newInstanceFromIndex(index);
            this.cache.instanceLookup.set(index, o);
            return o;
        }

        //if(this.cache.instanceLookup[index] === undefined) {
        //    this.cache.instanceLookup[index] = this.newInstanceFromIndex(index);
        //}

        //return this.cache.instanceLookup[index];

    }

    static getReferenceType(type, typedArrayValueIndex) {
        const index = Atomics.load(type.typedArray, typedArrayValueIndex);
        return (index === 0 ? null : this.getInstance(index));
    }

    static getPrimitiveType(type, typedArrayValueIndex) {
        return (type.getTransform(Atomics.load(type.typedArray, typedArrayValueIndex)));
    }

    static setReferenceType(v, type, typedArrayValueIndex) {

        if(v === null) {

            Atomics.store(type.typedArray, typedArrayValueIndex, 0);

        } else {

            Atomics.store(type.typedArray, typedArrayValueIndex, v._b.index);

        }

    }

    static setPrimitiveType(v, type, typedArrayValueIndex) {

        Atomics.store(type.typedArray, typedArrayValueIndex, type.setTransform(v));

    }


    static setRaw(v, type, typedArrayValueIndex) {

        if(type.referenceType){

            this.setReferenceType(v, type, typedArrayValueIndex);
            
        } else {
            this.setPrimitiveType(v, type, typedArrayValueIndex);

        }

    }
    static defineObjectProp(o, prop) {

        const props = o._b.meta.propsComputed;

        const type = props[prop].type;

        
        const typedArrayValueIndex = (o._b.index + props[prop].offset) / type.bytes;

        if(type.referenceType) {

            Object.defineProperty(o, prop, {
                enumerable: true,
                get() {
                    return MemorySystem.getReferenceType(type, typedArrayValueIndex);
                },
                set(v) {
                    MemorySystem.setReferenceType(v, type, typedArrayValueIndex);
                }
            });

        } else {

            Object.defineProperty(o, prop, {
                enumerable: true,
                get() {
                    return MemorySystem.getPrimitiveType(type, typedArrayValueIndex);
                },
                set(v) {
                    MemorySystem.setPrimitiveType(v, type, typedArrayValueIndex);
                }
            });

        }
    }
    /*
    static async lockObject() {

        return new Promise((resolve) => {
            // 'this' is the object, not MemorySystem
            if (Atomics.compareExchange(MemorySystem.int32Array, this._b.index / 4, 1, 2) !== 1) {
                // Promise apparently is never rejected according to MDN docs.
                Atomics.waitAsync(MemorySystem.int32Array, this._b.index / 4, 2, 2000).value.then((o) => {
                    resolve(o);
                });
            } else {
                resolve("not locked");
            }
        });

    }

    static unlockObject() {

        // 'this' is the object, not MemorySystem

        if (Atomics.compareExchange(MemorySystem.int32Array, this._b.index / 4, 2, 1) !== 2) {
            throw new Error("Trying to unlock an already unlocked object");
        }

        Atomics.notify(MemorySystem.int32Array, this._b.index / 4);

    }
    */

}



export class Buffifier {

    static rootObject = null;

    static isMainThread = null;
    
    static start() {
        this.tick = this.tock;
        this.tick();
    }

    static tick = () => undefined;

    static signalWorkers() {

        const signalIndex = MemorySystem.metaDataIndices.workersSignal;
        const n1 = Atomics.compareExchange(MemorySystem.int32Array, signalIndex, 0, 1);
        
        if(n1 !== 0) {
            throw new Error("signalWorkers: Expected 0 on compareExchange. Got " + n1 + ".");
        }

        const agentsAwoken = Atomics.notify(MemorySystem.int32Array, signalIndex);

        const n2 = Atomics.compareExchange(MemorySystem.int32Array, signalIndex, 1, 0);

        if(n2 !== 1){
            throw new Error("signalWorkers: Expected 1 on compareExchange. Got " + n2 + ".");
        }

        return agentsAwoken;
    }

    static tock() {

        requestAnimationFrame(async () => {

            const workersSignaled = Buffifier.signalWorkers();

            await ThreadSystem.instance.work();

            if(workersSignaled < WorkerSystem.workers.length) {
                console.log("ALL WORKERS NOT SIGNALED, WORKERS SIGNALED: " + workersSignaled);
            }

            //setTimeout(() => {
                this.tick();
            //}, 500);

        });
    }

    static async initFromWorker(sharedArrayBuffer, threadInstanceIndex, threadId, threadInitConfig) {

        return new Promise((resolve) => {

            this.isMainThread = false;

            // use the passed in SharedArrayBuffer  
            // because we are in a worker thread
            MemorySystem.init(sharedArrayBuffer);

            this.rootObject = MemorySystem.getInstance(MemorySystem.rootObjectIndex);

            ThreadSystem.initFromWorker(threadId, threadInstanceIndex);

            ThreadSystem.instance.init(this.rootObject, threadInitConfig).then(() => {
                resolve();
            });

        });
        
    }

    static async init(rootClass, canvas, options) {
        return new Promise(async (resolve) => {


            this.isMainThread = true;

            const workingOptions = Object.assign({
                allocate: 500000000, // allocates 500 MB for use (has to be evenly divisible by 8)
                rootObjectWorkingSpace: 0 // used if rootClass is variable in size (e.g., BufferedArray)
            }, options);

            // create new SharedArrayBuffer because this is on the main thread
            MemorySystem.init(new SharedArrayBuffer(workingOptions.allocate));

            // create the root object
            this.rootObject = MemorySystem.createInstance(rootClass, null, {
                workingSpace: workingOptions.rootObjectWorkingSpace
            });

            await ThreadSystem.init(ThreadSystem.threadIds.main);

            await WorkerSystem.init(canvas.transferControlToOffscreen());

            resolve(this.rootObject);

        });
    }

    // nice to have here to not expose MemorySystem
    static createInstance(...args) {
        return MemorySystem.createInstance(...args);
    }

}

export class WorkerSystem {

    static messages = {
        LOADED: "loaded",
        INIT: "init",
        READY: "ready"
    };

    static workers = [];

    static async init(offscreenCanvas) {
        return new Promise(async (resolve) => {

            let canvasWorker = null;

            for(const instance of ThreadSystem.threadInstances) {

                const threadId = instance.threadId;

                // if not main thread instance
                if(threadId > 0) {

                    const isCanvasThread = (threadId === 1);

                    const workerItem = {
                        loaded: false,
                        ready: false,
                        instance: new Worker("worker.js", { type: "module" }),
                        threadId: threadId,
                        threadInstance: instance,
                        threadInstanceConfig: isCanvasThread ? {
                            canvas: offscreenCanvas,
                            devicePixelRatio: globalThis.devicePixelRatio
                        } : {},
                        transferObjects: isCanvasThread ? [offscreenCanvas] : undefined
                    };

                    console.log("worker launched", workerItem);

                    if(isCanvasThread) {
                        canvasWorker = workerItem
                    } else {
                        this.workers.push(workerItem);
                    }
                }
            }

            console.log("all workers launched", this.workers);

            this.workers.push(canvasWorker);

            await this.rigWorkers();

            resolve();

        });

    }

    static async rigWorkers() {
        return new Promise(async (resolve) => {
            let currentWorkerInitIndex = 0;

            const sendNextInit = () => {

                if(currentWorkerInitIndex < this.workers.length) {
                    
                    const w = this.workers[currentWorkerInitIndex];

                    console.log("sending next init to", w);

                    w.instance.postMessage([
                        this.messages.INIT, 
                        w.threadInstance._b.index, 
                        w.threadId,
                        w.threadInstanceConfig,
                        MemorySystem.buffer, 
                        w.transferObjects
                    ], w.transferObjects);

                    currentWorkerInitIndex++;

                } else {
                    resolve();
                }

            };

            for(const worker of this.workers) {
                
                worker.instance.addEventListener("message", async ({ data }) => {
                
                    console.log("worker message received", data, worker);

                    if(data[0] === this.messages.LOADED) {
        
                        worker.loaded = true;
        
                        if(this.workers.every(w => w.loaded)) {

                            sendNextInit();

                        }
        
                    } else if (data[0] === this.messages.READY) {
        
                        worker.ready = true;
        
                        sendNextInit();
        
                    }
        
                });
            }
        });
    }

    static onWorkersReady () {
        console.log("workers ready!!!");
    }

    static onWorkerReceiveMessage = async ({ data }) => {

        if(data[0] === this.messages.INIT) {

            const threadInstanceIndex = data[1];
            const threadId = data[2];
            const threadInitConfig = data[3];
            const sharedArrayBuffer = data[4];

            await Buffifier.initFromWorker(sharedArrayBuffer, threadInstanceIndex, threadId, threadInitConfig);

            postMessage([this.messages.READY]);

            this.tick();

        }
        
    }

    static async tick() {

        Atomics.wait(MemorySystem.int32Array, MemorySystem.metaDataIndices.workersSignal, 0);

        await ThreadSystem.instance.work();

        this.tick();
    }

}

class ThreadSystem {

    static instance = null;

    static totalThreads = 
        config.threads.main.length + 
        config.threads.canvas.length + 
        config.threads.others.length
    ;

    static currentThreadId = null;

    static threadIds = {
        main: 0,
        canvas: 1
    };

    static threadInstances = null;

    // TODO: Add methods to load/store thread instance meta data

    static initFromWorker(threadId, threadInstanceIndex) {

        this.currentThreadId = threadId;

        this.instance = MemorySystem.getInstance(threadInstanceIndex);

    }

    static async init(threadId) {
        return new Promise(async (resolve) => {

            this.currentThreadId = threadId;

            const threadClass = this.getThreadClassById(threadId);

            this.instance = MemorySystem.createInstance(threadClass, { threadId });
                
            if(this.threadIds.main === threadId) {

                // since we are on the main thread, we create all other thread 
                // instances here so workers can load the one they are
                // assigned via postMessage -> MemorySystem.getInstance

                this.threadInstances = new Array(this.totalThreads);

                // add already created main instance
                this.threadInstances[this.threadIds.main] = this.instance;

                // create canvas thread instance
                this.threadInstances[this.threadIds.canvas] = 
                    MemorySystem.createInstance(this.getThreadClassById(this.threadIds.canvas), {
                        threadId: this.threadIds.canvas
                    });
                
                let n = 2;
                
                // create the others
                for(const cls of config.threads.others) {
                    this.threadInstances[n] = MemorySystem.createInstance(cls, {
                        threadId: n
                    });
                    n++;
                }

                await this.instance.init(Buffifier.rootObject);

                resolve();
            }

        });

    }

    static getThreadClassById(threadId) {

        if(threadId === 0) {
            return config.threads.main[0];
        } else if(threadId === 1) {
            return config.threads.canvas[0];
        } else if(threadId > 1) {
            return config.threads.others[threadId - 2];
        }

    }
    
}


