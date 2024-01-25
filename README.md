# Buffifier
Currently a work in progress. 

Buffifier is a framework that hopefully helps solve the problem of having to communicate large amounts of data to multiple web workers with low latency. This is accomplished with SharedArrayBuffer, Atomics, and intercepting object properties via setters/getters. It tries to be as minimally invasive as possible by not requiring you to change much of your app. This repository is a minimal example to demonstrate and how to use the framework. The "meat and potatoes" is in Buffifier.js, and ideally, that is the only file you will need to include in your app.

---

**How to see it in action:**

Download/clone this repository.

Run this command in the same folder to start a simple web server: ``py -3 -m secure_server``

Alternatively, setup any simple web server that serves the files with these response headers:

```
Cross-Origin-Opener-Policy: same-origin 
Cross-Origin-Embedder-Policy: require-corp
```

Headers are required for SharedArrayBuffer and unthrottled performance.now() timers.

Navigate to the http://localhost:8000, and you should see something like this:

<img width="374" src="https://github.com/addunn/Buffifier/assets/43220218/cfda5f87-ffd1-4eda-8c1f-4e537766eada">

(_it's a work in progress, so it only shows a still Three.js scene for now_)

---

**How to set up a class so instances are shared across web workers:**

(_instructions are incomplete_) 

### RootClass.js
```javascript
import { DataTypes } from "./Buffifier.js";

export class RootClass {

    // Not shared accross web workers
    someProperty = 10;

    // Special static property that defines the class for Buffifier
    static _meta = {
        get props() {
            return {
                // Define shared properties here with any type in DataTypes
                someSharedProperty: DataTypes.Int32
            }
        }
    };
}
```

### Buffifier.js
You'll need to edit Buffifier.js a bit to work with your application.
```javascript
import { RootClass } from "./RootClass.js";
import { MainThread } from "./MainThread.js";
import { CanvasThread } from "./CanvasThread.js";
import { OtherThread } from "./OtherThread.js";

const config = {
    classes: [
        RootClass
    ],
    threads: {
        main: [ 
            MainThread 
        ],
        canvas: [ 
            CanvasThread
        ],
        others: [
            OtherThread
        ]
    }
};

export const DataTypes = {
    // Add your classes to this list so they can be identified properly
    RootClass: 12,
    MainThread: 13,
    CanvasThread: 14,
    OtherThread: 15
}
```

### main.js
```javascript
import { RootClass } from "./RootClass.js";

// Initializes Buffifier:
//   - Starts all web workers
//   - Creates an instance of RootClass that is backed by SharedArrayBuffer.
//   - Gives all web workers access to the same RootClass instance.
//   - Starts an animation frame loop that will execute some method on all threads: MainThread.js, CanvasThread.js, OtherThread.js.
const rootClassInstance = Buffifier.init(RootClass);

// Web workers will immediatly have access to someSharedProperty's new value after this statement executes here.
rootClassInstance.someSharedProperty = 10;

// Web workers will not see changes of someProperty's value on their side because it's not a shared property.
rootClassInstance.someProperty = 10;

```
