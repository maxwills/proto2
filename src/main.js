import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'dat.gui';


let camera, scene, renderer;

init();

// we will load a 3d file. It is a gltf file.
// When it loads, it is a group, which has 1 child node, which is an objec3d
// acting essentially as a group.
// Inside that there are the meshes we want to interact with.
// Each one of these meshes represent what we call here a "segment".
// The idea is that the UI will allow the user to show or hide each one of these segments.

function addFolder(folder, name,  segments){
    let newFolder = folder.addFolder(name);
    for (let i = 0; i < segments.length; i++) {
        let segment = segments[i];
        if (segment.children.length > 0) {
            newFolder.add(segment, 'visible').name(segment.name).onChange((value) => {
                segment.traverse((child) => {child.visible=value}); // we need to traverse the children to set the visibility of all of them
                render();
            });
            addFolder(newFolder, segment.name+ "(sub)", segment.children);
        }
        else{
            newFolder.add(segment, 'visible').name(segment.name).onChange((value) => {
                segment.traverse((child) => {child.visible=value}); // we need to traverse the children to set the visibility of all of them
                render();
            });
        }
    }
    return newFolder;
}

function showGUI(segments){

    let gui = new GUI({ autoPlace: false });
    
    //add the dom element to the body
    document.body.appendChild(gui.domElement);
    // make it floating over the canvas
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0px';
    gui.domElement.style.right = '0px';
    // gui.domElement.style.zIndex = '1';

    // we add checkboxes to toggle visibility of each segment

    let mainFolder = addFolder(gui, "Visiblity Control", segments);
    
    
    mainFolder.open();
    //this._editor.signals.projectorChanged.dispatch({ projector, gui: this.gui })
}


function init() {


    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
    camera.position.set( - 1.8, 0.6, 2.7 );

    scene = new THREE.Scene();

    // new RGBELoader()
    //     .setPath( 'textures/equirectangular/' )
    //     .load( 'royal_esplanade_1k.hdr', function ( texture ) {

    //         texture.mapping = THREE.EquirectangularReflectionMapping;

    //         scene.background = texture;
    //         scene.environment = texture;

    //         render();

            

    //     } );

        const loader = new GLTFLoader();
        loader.load( 'ab.gltf', async function ( gltf ) {

            const model = gltf.scene;

            // wait until the model can be added to the scene without blocking due to shader compilation

            await renderer.compileAsync( model, camera, scene );

            scene.add( model );
            console.log(model);
            let scale = 0.01;
            model.scale.set(scale, scale, scale); 
            showGUI(model.children[0].children);  // hard coded as described above
            render();

        } );


    //set the backgorund to red
    scene.background = new THREE.Color(0xffffff);
    
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set( 0, 0, - 0.2 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize );
    //add lighting to scene
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 20, 0 );
    //increase the intensity of the light
    hemiLight.intensity = 2;
    scene.add( hemiLight );
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

//

function render() {

    renderer.render( scene, camera );

}

