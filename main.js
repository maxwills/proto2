import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

const SHADER_MODE = 1;
const DECAL_MODE = 2;
const point_render_mode = DECAL_MODE;
const n_tubes = 10;

/* Shader example config -------------*/
const UNLIT_POINT_MODE = 1;
const PHONG_POINT_MODE = 2;
const MIX1_POINT_MODE = 3;
const MIX2_POINT_MODE = 4;

/* Decal example config -------------*/
let decal_scale = 0.9; // 0.9 mismo tamaño que shader example
let decal_scale_y = 1.0;
let fake_colormap = false;
const decal_lighting = false;
const point_colors = [0xff0000, 0xff00ff, 0x0000ff];
const circle_texture_file = 'circle.png';
const soft_circle_texture_file = 'softcircle.png';


if (fake_colormap) {
    decal_scale = 1.1;
    decal_scale_y = 3.5;
}


/* Scene config ------------------ */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 1000);
const controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
controls.update();


const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(1, 1, 1).normalize();
scene.add(dirLight);

const pmaterial = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
const param_geometry = new ParametricGeometry(ParametricGeometries.plane(50, 100), 30, 10);
param_geometry.center();
const p_object = new THREE.Mesh(param_geometry, pmaterial);
p_object.position.set(5, 5, 5);


const geometry = new THREE.BufferGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const radius = 5;
const positions = [
    20, 0, 0,    // v1
    0, 50, 0,  // v2
    -10, 0, 0  // v3
];

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.computeVertexNormals();

const object = new THREE.Mesh(geometry, material);
//scene.add(object); //add hand made triangle
var cylinders = [];

function initialize_scene() {

    for (var i = 0; i < n_tubes; i++) {
        var cyl = addCylinder((i - n_tubes * 0.5) * 12);
        
        if (point_render_mode == DECAL_MODE) {
            for (var k = 0; k < 3; k++) {
                addDecalAt(cyl, y_gap * (1 - k), point_colors[k]);
            }
        }
        else if (point_render_mode == SHADER_MODE) {
            for (var k = 0; k < 3; k++) {
                cyl.material.uniforms.y_offset.value= y_gap;
                cyl.material.uniforms.pcolorindex.value = k;
            }
        }
    }
}

function addCylinder(x) {
    const cyl_geometry = new THREE.CylinderGeometry(radius, radius, 500, 32);
    //cyl_geometry.computeVertexNormals();
    let cyl_material;
    if (point_render_mode == DECAL_MODE) {
        cyl_material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    }
    else if (point_render_mode == SHADER_MODE) {
        let my_uniforms = {
            y_offset: {value: 0.0}, 
            tube_x: {value:x},
            pcolorindex: { value: 1 },
            pcolor1: { value: new THREE.Vector3(0, 0, 1) },
            pcolor2: { value: new THREE.Vector3(1, 0, 1) },
            pcolor3: { value: new THREE.Vector3(1, 0, 0) },
            point_shading_mode: { value: 1 },
        
        };
        
        let customUniforms = THREE.UniformsUtils.merge([
            THREE.ShaderLib.phong.uniforms,
            my_uniforms
        ]);
        
        let shader_mat = new THREE.ShaderMaterial({
            uniforms: customUniforms,
            vertexShader: vertex_shader_def,
            fragmentShader: fragment_shader_def,
            lights: true,
            name: 'custom-material'
        
        });
        cyl_material = shader_mat;
    }
    const cylinder = new THREE.Mesh(cyl_geometry, cyl_material);
    cylinder.position.set(x, 0, 0);
    scene.add(cylinder);
    cylinders.push(cylinder);
    return cylinder;
}

const y_gap = 20.0;

function animate() {

    requestAnimationFrame(animate);

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    render();

}

function render() {

    renderer.render(scene, camera);

}



/* DECAL ------------------------- */


function addDecalAt(cylinder, y = 0, color = 0xff0000) {
    const decalGeometry = new DecalGeometry(
        cylinder,
        new THREE.Vector3(0, y, radius * 0.5),
        new THREE.Euler(0, 0, 0),
        new THREE.Vector3(radius * 2.0 * decal_scale, radius * 2.0 * decal_scale * decal_scale_y, radius * 1.0)
    );
    let tex;
    if (fake_colormap) {
        tex = new THREE.TextureLoader().load(soft_circle_texture_file);
    }
    else {
        tex = new THREE.TextureLoader().load(circle_texture_file);
    }

    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;

    //   const 
    let decalMaterial;
    if (decal_lighting) {
        decalMaterial = new THREE.MeshPhongMaterial({
            color: color,
            map: tex,
            transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: - 4, polygonOffsetUnits: 2,
        });
    }
    else {
        decalMaterial = new THREE.MeshBasicMaterial({
            color: color,
            map: tex,
            transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: - 4, polygonOffsetUnits: 2,
        });
    }
    const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    cylinder.add(decalMesh);
}
// Add decals to the cylinder


/* SHADER PART ------------------------------------------------------- */

// SHADER PART

const vertex_shader_def = `

// uniform mat4 modelViewMatrix; // optional
// uniform mat4 projectionMatrix; // optional
varying vec3 vPosition;

#define PHONG

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>


void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;
    //same as following?
    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
   
    vPosition = (modelMatrix * vec4(position,1.0)).xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}

`;

const fragment_shader_def = `
    #define UNLIT_POINT_MODE 1
    #define PHONG_POINT_MODE 2
    #define MIX1_POINT_MODE 3
    #define MIX2_POINT_MODE 4
    #define INT_EQUALS(a,b) int(a)==int(b)
	varying vec3 vPosition;

    #define PHONG


uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform float y_offset;
uniform float tube_x;
uniform uint pcolorindex;
uniform vec3 pcolor1;
uniform vec3 pcolor2;
uniform vec3 pcolor3;
uniform uint point_shading_mode;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

vec4 get_point1(vec4 currentCol){
    vec3 pointPos = vec3(tube_x,-y_offset,5.0); 
    float dist=length(pointPos-vPosition);
    float radius=5.0;
    vec3 pcol = vec3(1.0,1.0,0.0);

    pcol = pcolor1;
  
    if ( dist*dist <= radius*radius){
        vec4 pointColor = vec4(pcol,1.0);
        if ( int(point_shading_mode) == int(UNLIT_POINT_MODE) ){
            return pointColor; // no lighting
        }
        else if( int(point_shading_mode) == int(PHONG_POINT_MODE) ){
            return currentCol*pointColor; // lighting multiplied
        }
        else if( int(point_shading_mode) == int(MIX1_POINT_MODE) ){
            return sqrt(currentCol*pointColor); // mix
        }
        else if( int(point_shading_mode) == int(MIX2_POINT_MODE) ){
            return (pointColor+sqrt(currentCol*pointColor))*0.5;
        }
        else{
            return vec4(0.0,0.0,0.0,1.0) ;
        }  
    }
    else{
        return currentCol;
    }
}

vec4 get_point2(vec4 currentCol){
    vec3 pointPos = vec3(tube_x,0,5.0); 
    float dist=length(pointPos-vPosition);
    float radius=5.0;
    vec3 pcol = vec3(1.0,1.0,0.0);

    pcol = pcolor2;

    if ( dist*dist <= radius*radius){
        vec4 pointColor = vec4(pcol,1.0);
        if ( int(point_shading_mode) == int(UNLIT_POINT_MODE) ){
            return pointColor; // no lighting
        }
        else if( int(point_shading_mode) == int(PHONG_POINT_MODE) ){
            return currentCol*pointColor; // lighting multiplied
        }
        else if( int(point_shading_mode) == int(MIX1_POINT_MODE) ){
            return sqrt(currentCol*pointColor); // mix
        }
        else if( int(point_shading_mode) == int(MIX2_POINT_MODE) ){
            return (pointColor+sqrt(currentCol*pointColor))*0.5;
        }
        else{
            return vec4(0.0,0.0,0.0,1.0) ;
        }  
    }
    else{
        return currentCol;
    }
}

vec4 get_point3(vec4 currentCol){
    vec3 pointPos = vec3(tube_x,y_offset,5.0); 
    float dist=length(pointPos-vPosition);
    float radius=5.0;
    vec3 pcol = vec3(1.0,1.0,0.0);
    pcol = pcolor3;
    if ( dist*dist <= radius*radius){
        vec4 pointColor = vec4(pcol,1.0);
        if ( int(point_shading_mode) == int(UNLIT_POINT_MODE) ){
            return pointColor; // no lighting
        }
        else if( int(point_shading_mode) == int(PHONG_POINT_MODE) ){
            return currentCol*pointColor; // lighting multiplied
        }
        else if( int(point_shading_mode) == int(MIX1_POINT_MODE) ){
            return sqrt(currentCol*pointColor); // mix
        }
        else if( int(point_shading_mode) == int(MIX2_POINT_MODE) ){
            return (pointColor+sqrt(currentCol*pointColor))*0.5;
        }
        else{
            return vec4(0.0,0.0,0.0,1.0) ;
        }  
    }
    else{
        return currentCol;
    }
}

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

    
    gl_FragColor = get_point1(gl_FragColor);
    gl_FragColor = get_point2(gl_FragColor);
    gl_FragColor = get_point3(gl_FragColor);
       

}
`;



/* END OF EXAMPLES ------------------------ */
initialize_scene();
animate();
