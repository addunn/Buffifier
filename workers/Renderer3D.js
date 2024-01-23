import * as THREE from '../three/three.module.js';
import { OrbitControlsModified } from '../three/addons/controls/OrbitControlsModified.js';
import { CSM } from '../three/addons/csm/CSM.js';

//export { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
//export { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
//export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//export { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
//export { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
//export { OBB } from 'three/addons/math/OBB.js';
//export { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
//export * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Renderer3DWorker {

    state = null;

    world = null;

    worldItems = null;

    canvas = null;

    scene = null;

    camera = null;

    renderer = null;

    controls = null;

    devicePixelRatio = null;

    canvasWidth = null;

    canvasHeight = null;

    csm = null;

    lastFrameStateData = null;

    init = async (state, config) => {

        return new Promise(async (resolve) => {

            console.log("Renderer3DWorker init", state, config);

            this.state = state;

            this.lastFrameStateData = {

                mouseX: this.state.mouseX,
                mouseY: this.state.mouseY,

                mouseDown: this.state.mouseDown,
                
                keyWDown: this.state.keyWDown,
                keyADown: this.state.keyADown,
                keySDown: this.state.keySDown,
                keyDDown: this.state.keyDDown,


                mouseWheelDeltaY: this.state.mouseWheelDeltaY

            };

            this.canvasWidth = this.state.canvasWidth;
            this.canvasHeight = this.state.canvasHeight;

            this.world = this.state.world;

            this.worldItems = this.world.items;

            this.canvas = config.canvas;

            this.devicePixelRatio = config.devicePixelRatio;

            this.scene = new THREE.Scene();

            this.scene.background = new THREE.Color("#000000");

            this.camera = new THREE.PerspectiveCamera(70, this.canvasWidth / this.canvasHeight, 0.1, 900);

            this.camera.position.set(0, 100, 200);

            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                canvas: this.canvas, 
                powerPreference: "high-performance"
            });

            this.renderer.setPixelRatio(this.devicePixelRatio);

            this.renderer.setSize(this.canvasWidth, this.canvasHeight);
            
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFShadowMap;

            const itemsLength = this.worldItems.length;

            for(let n = 0; n < itemsLength; n++) {
                const ent = await this.worldItems.get(n);

                const geometry = new THREE.BoxGeometry(ent.width, ent.height, ent.depth ); 
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ffff 
                }); 
                const cube = new THREE.Mesh( geometry, material ); 
                cube.castShadow = true;

                const x = ent.x;
                const y = ent.y;
                const z = ent.z;

                cube.position.x = x;
                cube.position.y = y;
                cube.position.z = z;

                this.scene.add( cube );

            }


            const planeGeometry = new THREE.PlaneGeometry(
                this.world.width,
                this.world.depth,
                this.world.cellsX, 
                this.world.cellsZ
            );
    
            planeGeometry.rotateX(-Math.PI / 2);

            const g1 = new THREE.MeshBasicMaterial({
                color: 0x333333,
                wireframe: true
            }); 
            const planeMesh = new THREE.Mesh( planeGeometry, g1 ); 

            planeMesh.receiveShadow = true;

            this.scene.add(planeMesh);

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

            this.controls = new OrbitControlsModified(this.camera, {
                canvasWidth: this.canvasWidth,
                canvasHeight: this.canvasHeight,
                devicePixelRatio: this.devicePixelRatio
            });

            // this.controls.enableDamping = true;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.target = new THREE.Vector3(0, 0, 0);
            

            //this.world = await new WorldEntity3D(this.root).init(this.config.world);

            
            const axesHelper = new THREE.AxesHelper(500);

            axesHelper.position.y = 0.01;
            this.scene.add(axesHelper);

            this.renderer.render(this.scene, this.camera);

            resolve();
        });
    }

    work = () => {

        return new Promise(async (resolve) => {

            const w = this.state.canvasWidth;
            const h = this.state.canvasHeight;

            if(w !== this.canvasWidth || h !== this.canvasHeight) {
                this.canvasWidth = w;
                this.canvasHeight = h;
                this.onCanvasSizeChange();
            }

            const currentFrameStateData = {

                mouseX: this.state.mouseX,
                mouseY: this.state.mouseY,

                mouseDown: this.state.mouseDown,

                keyWDown: this.state.keyWDown,
                keyADown: this.state.keyADown,
                keySDown: this.state.keySDown,
                keyDDown: this.state.keyDDown,

                mouseWheelDeltaY: this.state.mouseWheelDeltaY

            }


            if(currentFrameStateData.mouseDown > 0 && this.lastFrameStateData.mouseDown === 0) {


                this.controls.onMouseDown({
                    button: currentFrameStateData.mouseDown - 1,
                    clientX: currentFrameStateData.mouseX,
                    clientY: currentFrameStateData.mouseY
                });
            } else if(currentFrameStateData.mouseDown === 0 && this.lastFrameStateData.mouseDown > 0) {

                this.controls.onPointerUp();

            } else if(currentFrameStateData.mouseWheelDeltaY !== this.lastFrameStateData.mouseWheelDeltaY) {

                this.controls.onMouseWheel({
                    deltaY: currentFrameStateData.mouseWheelDeltaY,
                    clientX: currentFrameStateData.mouseX,
                    clientY: currentFrameStateData.mouseY
                });
            }

            if(currentFrameStateData.mouseX !== this.lastFrameStateData.mouseX || currentFrameStateData.mouseY !== this.lastFrameStateData.mouseY) {
                
                this.controls.onMouseMove({
                    pointer: 0,
                    clientX: currentFrameStateData.mouseX,
                    clientY: currentFrameStateData.mouseY
                });
            }


            const itemsLength = this.worldItems.length;

            
            for(let n = 0; n < itemsLength; n++) {
                const ent = this.worldItems.get(n);

                const ent3d = this.scene.children[n];
                ent3d.position.x = ent.x;
                ent3d.position.y = ent.y + 5;
                ent3d.position.z = ent.z;


                const vector = new THREE.Vector3();

                //ent3d.updateMatrixWorld();  // `obj´ is a THREE.Object3D

                vector.setFromMatrixPosition(ent3d.matrixWorld);

                vector.project(this.camera); // `camera` is a THREE.PerspectiveCamera
                //console.log(Math.round((0.5 + vector.x / 2) * (this.canvasWidth / this.devicePixelRatio)));
                ent.screenX = (0.5 + vector.x / 2) * this.canvasWidth;
                ent.screenY = (0.5 - vector.y / 2) * this.canvasHeight;

                ent.cameraDistance = this.camera.position.distanceTo(ent3d.position);
                
                
            }
            this.renderer.render(this.scene, this.camera);

            


            this.state.mouseWheelDeltaY = 0;

            this.lastFrameStateData = currentFrameStateData;

            // no idea why settimeout fixes the issue
            setTimeout(resolve);
            
        });

    }



    onCanvasSizeChange() {

        this.camera.aspect = this.canvasWidth / this.canvasHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio(this.devicePixelRatio);
        this.renderer.setSize(this.canvasWidth, this.canvasHeight);


        //this.csm.updateFrustums();
    }
    
}









