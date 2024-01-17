  
const importExports = (e) => {
    Object.entries(e).forEach(([s, o]) => {
        globalThis[s] = o;
    });
};
importExports(await import("./Buffifier.js"));
importExports(await import("./State.js"));
importExports(await import("./Entity.js"));

Buffifier.init();

const stateObj1 = Buffifier.createObject(DataTypes.State);
const entityObj1 = Buffifier.createObject(DataTypes.Entity);

console.log("stateObj1.mouseX defaults to " + await stateObj1.mouseX.get());
console.log("stateObj1.mouseY defaults to " + await stateObj1.mouseY.get());

await stateObj1.mouseX.set(1000);
await stateObj1.mouseY.set(2000);

console.log("Now, stateObj1.mouseX is " + await stateObj1.mouseX.get());
console.log("Now, stateObj1.mouseY is " + await stateObj1.mouseY.get());

console.log("entityObj1.x defaults to " + await entityObj1.x.get());
console.log("entityObj1.y defaults to" + await entityObj1.y.get());

await entityObj1.x.set(Math.PI);
await entityObj1.y.set(Math.sqrt(2));

console.log("Now, entityObj1.x is " + await entityObj1.x.get());
console.log("Now, entityObj1.y is " + await entityObj1.y.get());

console.log(Buffifier.buffer);
console.log(stateObj1);
console.log(entityObj1);