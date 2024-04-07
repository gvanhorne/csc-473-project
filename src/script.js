import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import * as d3o from 'd3-octree'

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

let tree = d3o.octree()

// Scene
const scene = new THREE.Scene()

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

// Add particles
const particleGeometry = new THREE.SphereGeometry( 0.02, 32 ); // Example particle geometry
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Example particle material

const n = 200;
const positions = new Float32Array(n * 3); // Store positions
const velocities = new Float32Array(n * 3); // Store velocities
const masses = new Float32Array(n); // Store masses

for (let i = 0; i < n; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Randomize position
    particle.position.x = Math.random() * 4 - 2;
    particle.position.y = Math.random() * 4 - 2;
    particle.position.z = Math.random() * 4 - 2;

    // Randomize velocity
    const vx = Math.random() * 0.2 - 0.01;
    const vy = Math.random() * 0.2 - 0.01;
    const vz = Math.random() * 0.2 - 0.01;

    velocities[i * 3] = vx;
    velocities[i * 3 + 1] = vy;
    velocities[i * 3 + 2] = vz;

    // Assign mass (you can randomize this as well)
    masses[i] = Math.random() * 0.5 + 0.1; // Random mass between 0.1 and 0.6

    // Add particle to the scene
    scene.add(particle);
    tree.add([particle.position.x, particle.position.y, particle.position.z])
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Animate
const clock = new THREE.Clock()

const tick = () => {
    tree = d3o.octree()
    const deltaTime = clock.getDelta();
    // Loop through each particle
    for (let i = 0; i < n; i++) {
        // Get current position and velocity of the particle
        const particle = scene.children[i + 1]; // Adding 1 because the first child is the light
        const position = particle.position;
        const velocity = {
            x: velocities[i * 3],
            y: velocities[i * 3 + 1],
            z: velocities[i * 3 + 2]
        };

        // Update position based on velocity
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
        position.z += velocity.z * deltaTime;

        // Check for boundary collision and reverse velocity if needed
        if (position.x < -2 || position.x > 2) {
            velocities[i * 3] *= -1;
        }
        if (position.y < -2 || position.y > 2) {
            velocities[i * 3 + 1] *= -1;
        }
        if (position.z < -2 || position.z > 2) {
            velocities[i * 3 + 2] *= -1;
        }

        // Update positions array for later use (optional)
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
        tree.add([particle.position.x, particle.position.y, particle.position.z])
    }

    // Update Orbital Controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()
