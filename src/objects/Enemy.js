import * as THREE from 'three';

export class Enemy {
    constructor(scene, bulletPatterns, x, y, z) {
        this.scene = scene;
        this.bulletPatterns = bulletPatterns;
        this.active = true;
        this.hp = 10;

        // Visual
        const geometry = new THREE.OctahedronGeometry(1.0);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.scene.add(this.mesh);

        // Hitbox Debug (F3+B style Box)
        const hitGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(3.0, 3.0, 3.0));
        const hitMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.hitbox = new THREE.LineSegments(hitGeo, hitMat);
        this.hitbox.visible = false;
        this.mesh.add(this.hitbox);

        this.time = 0;
        this.fireTimer = 0;
    }

    update(delta, playerPos) {
        if (!this.active) return;

        this.time += delta;

        // Simple movement: Move down slowly + sine wave
        this.mesh.position.z += 2.0 * delta; // Move towards camera
        this.mesh.position.x += Math.sin(this.time * 2) * 5.0 * delta;

        // Rotation
        this.mesh.rotation.y += delta;
        this.mesh.rotation.z += delta * 0.5;

        // Firing logic
        this.fireTimer += delta;
        if (this.fireTimer > 1.0) { // Shoot every 1s
            this.fireTimer = 0;
            // Aimed shot
            this.bulletPatterns.fireAimed(this.mesh.position, playerPos);
        }

        // Out of bounds check (Simple)
        if (this.mesh.position.z > 20) {
            this.deactivate();
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.deactivate();
            // TODO: Score, Explosion fx
            console.log("Enemy Destroyed");
        } else {
            // Flash effect
            this.mesh.material.emissive.setHex(0xffffff);
            setTimeout(() => {
                if (this.active) this.mesh.material.emissive.setHex(0x440000);
            }, 50);
        }
    }

    deactivate() {
        this.active = false;
        this.scene.remove(this.mesh);
        // Clean up geometry/material if not pooled? 
        // For prototype, simple remove is fine.
    }
}
