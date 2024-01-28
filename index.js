import { Buffifier } from "./Buffifier.js";

import { App } from "./App.js";  

const app = await Buffifier.init(App, document.getElementById("canvas"));

Buffifier.start();





