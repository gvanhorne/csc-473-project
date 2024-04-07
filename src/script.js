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
const G = 0.01

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.set(2, 3, 4)
scene.add(pointLight)

// Add particles
const particleGeometry = new THREE.SphereGeometry( 0.01, 32 ); // Example particle geometry
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Example particle material

const n = 200;
const particles = []
const positions = [] // Store positions
const velocities = [] // Store velocities
const masses = new Float32Array(n); // Store masses

for (let i = 0; i < n; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Randomize position
    particle.position.set(
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2
    )

    particles.push(particle)

    // Randomize velocity
    const velocity = new THREE.Vector3(
        Math.random() * 0.2 - 0.01,
        Math.random() * 0.2 - 0.01,
        Math.random() * 0.2 - 0.01
    )

    velocities.push(velocity)

    // Assign mass (you can randomize this as well)
    masses[i] = Math.random() * 0.5 + 0.1; // Random mass between 0.1 and 0.6

    // Add particle to the scene
    scene.add(particle);
    tree.add(particle.position.toArray())
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

function calculateDistance(position1, position2) {
    const dx = position2.x - position1.x;
    const dy = position2.y - position1.y;
    const dz = position2.z - position1.z;

    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// Animate
const clock = new THREE.Clock()
const tick = () => {
    tree = d3o.octree()
    const dt = clock.getDelta();
    // Loop through each particle
    for (let i = 0; i < n; i++) {
        // Get current position and velocity of the particle
        const particle = particles[i];
        const position = particle.position;
        const mass = masses[i];
        let force;
        const velocity_prev = {
            x: velocities[i].x,
            y: velocities[i].y,
            z: velocities[i].z
        };
        // for (let j = 0; j < n; j++) {
        //     if (j == i) {
        //         continue
        //     }
        //     const other_mass = masses[j];
        //     const other_position = scene.children[j+2].position;
        //     const distance = calculateDistance(position, other_position)
        //     force = G*((mass*other_mass) / distance*distance);
        //     const acceleration = G*(mass/ distance*distance);
        //     // vnew = vold + a*dt
        // }

        // Update position based on velocity
        position.x += velocity_prev.x * dt;
        position.y += velocity_prev.y * dt;
        position.z += velocity_prev.z * dt;

        // Check for boundary collision and reverse velocity if needed
        if (position.x < -2 || position.x > 2) {
            velocities[i].x *= -1;
        }
        if (position.y < -2 || position.y > 2) {
            velocities[i].y *= -1;
        }
        if (position.z < -2 || position.z > 2) {
            velocities[i].z *= -1;
        }

        tree.add(particle.position.toArray());
    }

    // Update Orbital Controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()
