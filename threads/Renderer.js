import * as THREE from '../three/three.module.js';
import { OrbitControlsModified } from '../three/addons/controls/OrbitControlsModified.js';
import { DataTypes } from "../Buffifier.js";
import { BaseThread } from "./Base.js";
import { World } from "../World.js";

import { CSM } from '../three/addons/csm/CSM.js';

export class RendererThread extends BaseThread {

    static _meta = {

        get props() { 

            return {
                threadId: DataTypes.Uint8,
                test1: DataTypes.Uint32
            }

        }

    };

    app = null;

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

    lastFrameAppData = null;

    init = async (app, config) => {

        return new Promise(async (resolve) => {

            this.app = app;

            this.lastFrameAppData = {

                mouseX: this.app.mouseX,
                mouseY: this.app.mouseY,

                mouseDown: this.app.mouseDown,
                
                keyWDown: this.app.keyWDown,
                keyADown: this.app.keyADown,
                keySDown: this.app.keySDown,
                keyDDown: this.app.keyDDown,


                mouseWheelDeltaY: this.app.mouseWheelDeltaY

            };

            this.canvasWidth = this.app.canvasWidth;
            this.canvasHeight = this.app.canvasHeight;

            this.world = this.app.world;

            this.worldItems = this.world.items;

            this.canvas = config.canvas;

            this.devicePixelRatio = config.devicePixelRatio;

            this.scene = new THREE.Scene();

            this.scene.background = new THREE.Color("#000000");

            this.camera = new THREE.PerspectiveCamera(70, this.canvasWidth / this.canvasHeight, 0.1, 900);

            this.camera.position.set(0, 200, 400);

            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                canvas: this.canvas, 
                powerPreference: "high-performance"
            });

            this.renderer.setPixelRatio(this.devicePixelRatio);

            this.renderer.setSize(this.canvasWidth, this.canvasHeight);
            
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFShadowMap;




            const c = {
                far: 250,
                fade: true,
                mode: "practical",
                x: -0.5,
                y: -1,
                z: -0.5,
                shadowMapSize: 512,
                intensity: 2,
                cascades: 2
            };
    
            this.csm = new CSM( {
                fade: c.fade,
                maxFar: c.far,
                cascades: c.cascades,
                mode: c.mode,
                parent: this.scene,
                shadowMapSize: c.shadowMapSize,
                lightDirection: new THREE.Vector3(c.x, c.y, c.z).normalize(),
                lightIntensity: c.intensity,
                camera: this.camera
            });


            const itemsLength = this.worldItems.length;

            for(let n = 0; n < itemsLength; n++) {
                const ent = await this.worldItems.at(n);

                const geometry = new THREE.BoxGeometry(ent.width, ent.height, ent.depth ); 
                const material = new THREE.MeshStandardMaterial({
                    color: 0x00aaaa
                });
                this.csm.setupMaterial(material);

                const cube = new THREE.Mesh( geometry, material ); 


                cube.userData.entityIndex = n;
                cube.castShadow = true;
                cube.receiveShadow = false;

                cube.position.x = ent.x;
                cube.position.y = ent.y;
                cube.position.z = ent.z;

                this.scene.add( cube );

            }

            const planeGeometry = new THREE.PlaneGeometry(
                World.width,
                World.depth,
                World.cellsX, 
                World.cellsZ
            );

            planeGeometry.rotateX(-Math.PI / 2);

            const vertices = planeGeometry.attributes.position.array;

            const arr = [];

            for(let x = 0; x < World.cellsX + 1; x++) {
                for(let z = 0; z < World.cellsZ + 1; z++) {
                    const arrIndex = (x * (World.cellsZ + 1)) + z;
                    vertices[arrIndex * 3 + 1] = app.world.heightData.at(arrIndex);
                    arr.push(arrIndex);
                }
            }

            const tex = new THREE.CanvasTexture(this.generateTexture()) ;
        
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.offset.set(1 - (World.size - World.cellSize * 3) / World.size, 1 - (World.size - World.cellSize * 3) / World.size);
            tex.repeat.set((World.size - World.cellSize * 6) / World.size, (World.size - World.cellSize * 6) / World.size);

            //const groundMaterial = new THREE.MeshPhongMaterial( { 
            //    map: tex,
            //    wireframe: true
            //});




            const g1 = new THREE.MeshStandardMaterial({
                //color: 0x333333,
                map: tex,
                side: THREE.DoubleSide,
                //wireframe: true
            });
            this.csm.setupMaterial(g1);
            const planeMesh = new THREE.Mesh( planeGeometry, g1 ); 

            planeMesh.receiveShadow = true;
            planeMesh.castShadow = false;

            this.scene.add(planeMesh);

            this.scene.add(new THREE.AmbientLight(0xffffff, 1));

            this.controls = new OrbitControlsModified(this.camera, {
                canvasWidth: this.canvasWidth,
                canvasHeight: this.canvasHeight,
                devicePixelRatio: this.devicePixelRatio
            });

            // this.controls.enableDamping = true;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.target = new THREE.Vector3(0, 0, 0);

            const axesHelper = new THREE.AxesHelper(500);

            axesHelper.position.y = 0.01;
            this.scene.add(axesHelper);


            
            


            this.renderer.render(this.scene, this.camera);

            //setTimeout(() => {
                this.work();
            //}, 5);

            resolve();
        });
    }

    generateTexture() {

        const data = [...this.app.world.heightData];
        
        const width = World.segments;
        const height = World.segments;

        let context, image, imageData, shade;

        const vector3 = new THREE.Vector3( 0, 0, 0 );

        const sun = new THREE.Vector3( 1, 1, 1 );
        sun.normalize();

        const canvas = new OffscreenCanvas(width, height);


        context = canvas.getContext( '2d' );
        context.fillStyle = '#000';
        context.fillRect( 0, 0, width, height );

        image = context.getImageData( 0, 0, canvas.width, canvas.height );
        imageData = image.data;

        const d = [];

        for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

            vector3.x = data[ j - 2 ] - data[ j + 2 ];
            vector3.y = 2;
            vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
            vector3.normalize();

            shade = vector3.dot( sun );

            d.push(shade);

            imageData[ i ] = ( shade * 20 ) * ( 0.3 + data[ j ] * 0.0007 ) + 20;
            imageData[ i + 1 ] = ( shade * 20 ) * ( 0.3 + data[ j ] * 0.0007 ) + 70;
            imageData[ i + 2 ] = ( shade * 20 ) * ( 0.3 + data[ j ] * 0.0007 ) + 30;

        }

        context.putImageData( image, 0, 0 );

        const canvasScaled = new OffscreenCanvas(width, height);
        canvasScaled.width = width * 10;
        canvasScaled.height = height * 10;

        context = canvasScaled.getContext("2d");
        context.scale( 10, 10 );
        context.drawImage( canvas, 0, 0 );

        image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height);
        imageData = image.data;

        for ( let i = 0, l = imageData.length; i < l; i += 4 ) {

            const v = ~ ~ (Math.random() * 30);

            imageData[i] += v;
            imageData[i + 1] += v;
            imageData[i + 2] += v;

        }

        context.putImageData(image, 0, 0);

        return canvasScaled;

    }

    work = () => {

        return new Promise(async (resolve) => {

            const w = this.app.canvasWidth;
            const h = this.app.canvasHeight;

            if(w !== this.canvasWidth || h !== this.canvasHeight) {
                this.canvasWidth = w;
                this.canvasHeight = h;
                this.onCanvasSizeChange();
            }

            const currentFrameAppData = {

                mouseX: this.app.mouseX,
                mouseY: this.app.mouseY,

                mouseDown: this.app.mouseDown,

                keyWDown: this.app.keyWDown,
                keyADown: this.app.keyADown,
                keySDown: this.app.keySDown,
                keyDDown: this.app.keyDDown,

                mouseWheelDeltaY: this.app.mouseWheelDeltaY

            }


            if(currentFrameAppData.mouseDown > 0 && this.lastFrameAppData.mouseDown === 0) {


                this.controls.onMouseDown({
                    button: currentFrameAppData.mouseDown - 1,
                    clientX: currentFrameAppData.mouseX,
                    clientY: currentFrameAppData.mouseY
                });
            } else if(currentFrameAppData.mouseDown === 0 && this.lastFrameAppData.mouseDown > 0) {

                this.controls.onPointerUp();

            } else if(currentFrameAppData.mouseWheelDeltaY !== this.lastFrameAppData.mouseWheelDeltaY) {

                this.controls.onMouseWheel({
                    deltaY: currentFrameAppData.mouseWheelDeltaY,
                    clientX: currentFrameAppData.mouseX,
                    clientY: currentFrameAppData.mouseY
                });
            }

            if(currentFrameAppData.mouseX !== this.lastFrameAppData.mouseX || currentFrameAppData.mouseY !== this.lastFrameAppData.mouseY) {
                
                this.controls.onMouseMove({
                    pointer: 0,
                    clientX: currentFrameAppData.mouseX,
                    clientY: currentFrameAppData.mouseY
                });
            }


            const itemsLength = this.worldItems.length;

            
            for(let n = 0; n < itemsLength; n++) {
                const ent = this.worldItems.at(n);

                const ent3d = this.scene.children[n];
                ent3d.position.x = ent.x;
                ent3d.position.y = ent.y + 5;
                ent3d.position.z = ent.z;

                if(ent.mouseOver) {
                    //ent3d.visible = false;
                } else {
                    //ent3d.visible = true;
                    //ent3d.material.color = 0x00cccc;
                    //ent3d.material.opacity = 1;
                }

                const vector = new THREE.Vector3();

                //ent3d.updateMatrixWorld();  // `obj´ is a THREE.Object3D

                vector.setFromMatrixPosition(ent3d.matrixWorld);

                vector.project(this.camera); // `camera` is a THREE.PerspectiveCamera
                //console.log(Math.round((0.5 + vector.x / 2) * (this.canvasWidth / this.devicePixelRatio)));
                ent.screenX = (0.5 + vector.x / 2) * this.canvasWidth;
                ent.screenY = (0.5 - vector.y / 2) * this.canvasHeight;

                ent.cameraDistance = this.camera.position.distanceTo(ent3d.position);
                
                
            }


            // RAY CAST

            const x = this.app.mouseX;
            const y = this.app.mouseY;


            const rc = new THREE.Raycaster();
            const pointer = new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1);

            rc.setFromCamera(pointer, this.camera);

            const intersects = rc.intersectObjects(this.scene.children, true);

            this.app.mouseOverEntityIndices.length = intersects.length;

            for(let n = 0; n < intersects.length; n++) {
                this.app.mouseOverEntityIndices.set(n, intersects[n].object.userData.entityIndex);
            }

            this.csm.update();

            this.renderer.render(this.scene, this.camera);

            this.app.mouseWheelDeltaY = 0;

            this.lastFrameAppData = currentFrameAppData;

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









