import * as THREE from 'three';
import { STAGE_WIDTH, STAGE_HEIGHT, STAGE_DEPTH } from '../constants.js';

const MAX_BULLETS = 5000;

export class BulletSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.maxBullets = config.maxBullets || MAX_BULLETS;
        const color = config.color || 0xff00ff;
        const size = config.size || 0.3;

        // Geometry & Material
        const geometry = new THREE.SphereGeometry(size, 6, 6); // Low poly
        const material = new THREE.MeshBasicMaterial({ color: color });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.maxBullets);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);

        // Debug Hitbox Mesh (F3+B Style)
        const debugGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(size * 2, size * 2, size * 2));
        const debugMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.debugMesh = new THREE.InstancedMesh(debugGeo, debugMat, this.maxBullets);
        this.debugMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.debugMesh.visible = false;
        this.scene.add(this.debugMesh);

        // Data arrays
        this.velocities = new Float32Array(this.maxBullets * 3); // x, y, z
        this.positions = new Float32Array(this.maxBullets * 3); // x, y, z
        this.active = new Uint8Array(this.maxBullets); // 0 or 1

        // Helper Object3D for matrix calculation
        this.dummy = new THREE.Object3D();

        // Initialize all off-screen
        for (let i = 0; i < this.maxBullets; i++) {
            this.active[i] = 0;
            this.dummy.position.set(0, -1000, 0);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.debugMesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        this.debugMesh.instanceMatrix.needsUpdate = true;
    }

    setDebugVisible(visible) {
        this.debugMesh.visible = visible;
    }

    spawn(x, y, z, vx, vy, vz) {
        // Find first inactive bullet
        let index = -1;
        for (let i = 0; i < this.maxBullets; i++) {
            if (this.active[i] === 0) {
                index = i;
                break;
            }
        }

        if (index === -1) return; // Pool full

        this.active[index] = 1;

        // Set Velocity
        this.velocities[index * 3] = vx;
        this.velocities[index * 3 + 1] = vy;
        this.velocities[index * 3 + 2] = vz;

        // Set Position
        this.positions[index * 3] = x;
        this.positions[index * 3 + 1] = y;
        this.positions[index * 3 + 2] = z;

        this.dummy.position.set(x, y, z);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(index, this.dummy.matrix);
        this.debugMesh.setMatrixAt(index, this.dummy.matrix);

        this.mesh.instanceMatrix.needsUpdate = true;
        this.debugMesh.instanceMatrix.needsUpdate = true;
    }

    update(delta) {
        let dirty = false;
        const halfW = STAGE_WIDTH / 2 + 20; // Margin increased
        const halfH = STAGE_HEIGHT + 20;
        const halfD = STAGE_DEPTH / 2 + 50; // Increased to handle z=-30 shots and margin

        for (let i = 0; i < this.maxBullets; i++) {
            if (this.active[i] === 0) continue;

            // Update position
            const idx = i * 3;
            this.positions[idx] += this.velocities[idx] * delta;
            this.positions[idx + 1] += this.velocities[idx + 1] * delta;
            this.positions[idx + 2] += this.velocities[idx + 2] * delta;

            const px = this.positions[idx];
            const py = this.positions[idx + 1];
            const pz = this.positions[idx + 2];

            this.dummy.position.set(px, py, pz);

            // Bounds check
            if (px < -halfW || px > halfW ||
                pz < -halfD || pz > halfD ||
                py < -10 || py > 50) {

                this.active[i] = 0;
                this.dummy.position.set(0, -1000, 0);
            }

            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.debugMesh.setMatrixAt(i, this.dummy.matrix);
            dirty = true;
        }

        if (dirty) {
            this.mesh.instanceMatrix.needsUpdate = true;
            this.debugMesh.instanceMatrix.needsUpdate = true;
        }
    }
}
