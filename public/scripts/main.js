import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://unpkg.com/three@0.126.1/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // White background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// Loaders
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.4.1/"); 
loader.setDRACOLoader(dracoLoader);

// ✨ Mall model loading from Netlify URL
let clickableObjects = [];

// 🚀 UPDATED Netlify URL below!
const mallModelURL = "https://glistening-beignet-a33d5c.netlify.app/models/mall.glb";

loader.load(
  mallModelURL,
  (gltf) => {
    const mallScene = gltf.scene;
    mallScene.scale.set(1.5, 1.5, 1.5); 
    scene.add(mallScene);

    mallScene.traverse((child) => {
      if (child.isMesh) {
        clickableObjects.push(child);
      }
    });
  },
  (xhr) => {
    console.log(`Mall loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
  },
  (error) => {
    console.error("Error loading mall model:", error);
  }
);

// Raycaster for clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onDocumentClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    console.log("Clicked on:", clickedObject.name);
    window.location.href = `/product-viewer?product=${encodeURIComponent(clickedObject.name)}`;
  }
}

document.addEventListener("click", onDocumentClick, false);

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
