# Buffifier
Currently a work in progress. 

Buffifier is a framework that hopefully helps solve the problem of having to communicate large amounts of data to multiple web workers with low latency. This is accomplished with SharedArrayBuffer, Atomics, and intercepting object properties via setters/getters. It tries to be as minimally invasive as possible by not requiring you to change much of your app.

---


How to set up a class so instances are shared across web workers:

(_work in progress, instructions are incomplete_) 

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
