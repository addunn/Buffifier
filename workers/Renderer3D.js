import * as THREE from '../three/three.module.js';
//export { CSM } from 'three/addons/csm/CSM.js';
//export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

    ctx = null;

    init = async (state, config, canvas) => {

        console.log("Renderer3DWorker init", state, config, canvas);
        return new Promise(async (resolve) => {

            this.state = state;

            this.canvasWidth = await this.state.canvasWidth.get();
            this.canvasHeight = await this.state.canvasHeight.get();

            this.world = await this.state.world.get();

            this.worldItems = await this.world.items.get();

            this.canvas = canvas;




            //this.ctx = this.canvas.getContext("2d");

            //ctx.fillRect(25, 25, 100, 100);
            //ctx.clearRect(45, 45, 60, 60);
            //ctx.strokeRect(50, 50, 50, 50);

            
            
            this.devicePixelRatio = config.devicePixelRatio;

            this.scene = new THREE.Scene();

            this.scene.background = new THREE.Color("#000000");

            console.log(this.canvasWidth, this.canvasHeight);
            this.camera = new THREE.PerspectiveCamera(70, this.canvasWidth / this.canvasHeight, 0.1, 4000);

            this.camera.position.set(100, 100, 100);

            this.renderer = new THREE.WebGLRenderer( { antialias: true, canvas: this.canvas } );

            

            this.renderer.setPixelRatio(this.devicePixelRatio);

            this.renderer.setSize(this.canvasWidth, this.canvasHeight);
            
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFShadowMap;

            


            const itemsLength = await this.worldItems.length.get();

            for(let n = 0; n < itemsLength; n++) {
                const ent = await this.worldItems.get(n);

                const geometry = new THREE.BoxGeometry(ent.width, ent.height, ent.depth ); 
                const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
                const cube = new THREE.Mesh( geometry, material ); 

                const x = await ent.x.get();
                const y = await ent.y.get();
                const z = await ent.z.get();

                cube.position.x = x;
                cube.position.y = y;
                cube.position.z = z;

                this.scene.add( cube );

            }

            this.scene.add(new THREE.AmbientLight(0xffffff, 1));

            /*
            this.controls = new OrbitControls(this.camera, this.ui);
            this.controls.enableDamping = true;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.target = new THREE.Vector3((50 * 10) / 2, 0, (50 * 10) / 2);
            */

            //this.world = await new WorldEntity3D(this.root).init(this.config.world);

            
            const axesHelper = new THREE.AxesHelper(200);

            this.scene.add(axesHelper);


            this.renderer.render(this.scene, this.camera);
            
            resolve();
        });
    }

    work = async () => {
        return new Promise(async (resolve) => {
            //console.log("Renderer3DWorker work", this.renderer.domElement, this.scene, this.camera);

            
            const w = await this.state.canvasWidth.get();
            const h = await this.state.canvasHeight.get();

            if(w !== this.canvasWidth || h !== this.canvasHeight) {
                this.canvasWidth = w;
                this.canvasHeight = h;
                this.onCanvasSizeChange();
            }

            const itemsLength = await this.worldItems.length.get();

            for(let n = 0; n < itemsLength; n++) {
                const ent = await this.worldItems.get(n);

                const x = await ent.x.get();
                const y = await ent.y.get();
                const z = await ent.z.get();

                this.scene.children[n].position.x = x;
                this.scene.children[n].position.y = y;
                this.scene.children[n].position.z = z;

            }
            
            
            setTimeout(() => {
                this.renderer.render(this.scene, this.camera);
                resolve();
            });

        });
    }



    onCanvasSizeChange() {
        console.log("onCanvasSizeChange");
        this.camera.aspect = this.canvasWidth / this.canvasHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio(this.devicePixelRatio);
        this.renderer.setSize(this.canvasWidth, this.canvasHeight);

    }
    
}









