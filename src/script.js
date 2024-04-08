import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import * as d3o from 'd3-octree'

javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='https://mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

let tree = d3o.octree()

// Scene
const scene = new THREE.Scene()
let G = 1;
let n = 200;
let dt = 0.001

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.set(2, 3, 4)
scene.add(pointLight)

// Add particles
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Example particle material

const particles = []
let velocities = [] // Store velocities
const masses = new Float32Array(n); // Store masses

const particleGeometry = (mass) => {
    // Scale the radius based on the mass
    const radius = mass * 0.2; // You can adjust the factor to fit your needs
    return new THREE.SphereGeometry(radius, 32);
};

for (let i = 0; i < n; i++) {
    masses[i] = Math.random() * 0.5 + 0.1; // Random mass between 0.1 and 0.6
    const particle = new THREE.Mesh(particleGeometry(masses[i]), particleMaterial);

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

const parameters = {
    G: 1,
    n: 200,
    dt: 0.001,
    resetSimulation: resetSimulation
};

gui.add(parameters, 'G', 0, 2).step(0.01).onChange(() => {
    G = parameters.G;
});

gui.add(parameters, 'n', 2, 200).step(1).onChange(() => {
    resetSimulation(parameters.n);
});

gui.add(parameters, 'dt', 0.001, 0.1).step(0.001).onChange(() => {
    dt = parameters.dt;
});

gui.add(parameters, 'resetSimulation');

function resetSimulation(newN = n) {
    // Clear previous particles
    for (let i = 0; i < n; i++) {
        scene.remove(particles[i]);
    }
    particles.length = 0;

    // Reset arrays
    velocities.length = 0;
    masses.fill(0);

    // Update particle count
    n = newN;

    // Add new particles
    for (let i = 0; i < n; i++) {
        // Generate new random masses and velocities
        masses[i] = Math.random() * 0.5 + 0.1;
        const velocity = new THREE.Vector3(
            Math.random() * 0.2 - 0.01,
            Math.random() * 0.2 - 0.01,
            Math.random() * 0.2 - 0.01
        );
        velocities.push(velocity);

        // Create new particle mesh
        const particle = new THREE.Mesh(particleGeometry(masses[i]), particleMaterial);
        particle.position.set(
            Math.random() * 4 - 2,
            Math.random() * 4 - 2,
            Math.random() * 4 - 2
        );
        particles.push(particle);
        scene.add(particle);
        tree.add(particle.position.toArray());
    }
}

// Animate
const clock = new THREE.Clock()
const tick = () => {
    tree = d3o.octree()
    const vi_t = []; // New velocities
    const ri_t = []; // New positions
    // Loop through each particle
    for (let i = 0; i < n; i++) {
        const particle = particles[i];
        const position = particle.position;
        const netForce = new THREE.Vector3();

        for (let j = 0; j < n; j++) {
            if (j == i) {
                continue;
            }
            const mj = masses[j];
            const rj = particles[j].position.clone();
            const ri = position.clone();
            const F = (ri.sub(rj)).multiplyScalar(mj).divideScalar(Math.pow((ri.distanceTo(rj)), 3))

            netForce.add(F);
        }
        netForce.multiplyScalar(-G);

        // v_i(t) = F_i * dt * v_i(t0)
        let Fi = netForce.clone();
        let vi_t0 = velocities[i].clone();
        vi_t.push(Fi.multiplyScalar(dt).add(vi_t0))


        // r_i(t) = 1/2*F_i * dt^2 + v_i(t0)*dt + r_i(t0)
        Fi = netForce.clone();
        vi_t0 = velocities[i].clone();
        const ri_t0 = position.clone();
        ri_t.push(Fi
            .multiplyScalar(0.5)
            .multiplyScalar(Math.pow(dt, 2))
            .add(vi_t0.multiplyScalar(dt))
            .add(ri_t0)
        )

        // tree.add(particle.position.toArray());
    }

    // Advance positions and velocities simultaneously for all particles
    velocities = [];
    for (let i = 0; i < n; i++) {
        velocities.push(vi_t[i])
        particles[i].position.set(
            ri_t[i].x,
            ri_t[i].y,
            ri_t[i].z
        )
    }

    // Update Orbital Controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()
