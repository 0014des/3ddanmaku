import * as THREE from 'three';
import { STAGE_WIDTH, STAGE_HEIGHT, PLAYER_SPEED } from '../constants.js';

export class Player {
    constructor(scene) {
        this.scene = scene;

        // Visual Mesh
        const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.rotation.x = -Math.PI / 2; // Point "Forward" along -Z
        this.mesh.position.set(0, 0, 10); // Start near the bottom

        this.scene.add(this.mesh);

        // Hitbox visualization (F3+B style - Large White Box)
        // User requested size 2.0 and white
        const hitGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(2.0, 2.0, 2.0));
        const hitMat = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true });
        this.hitbox = new THREE.LineSegments(hitGeo, hitMat);
        this.hitbox.renderOrder = 999;
        this.hitbox.visible = false;
        this.mesh.add(this.hitbox);

        this.hp = 5;
        this.bomb = 3;
        this.invulnerableTime = 0;
        this.active = true;
    }

    toggleHitbox() {
        this.hitbox.visible = !this.hitbox.visible;
    }

    setHitboxVisible(visible) {
        this.hitbox.visible = visible;
    }

    update(delta, input) {
        if (!input) return;

        const { x, y } = input.getAxis();
        // Slow movement logic moved here or controlled by speed multiplier
        const speed = PLAYER_SPEED * delta * (input.isAction('SLOW') ? 0.5 : 1.0);

        // Movement on XZ plane
        this.mesh.position.x += x * speed;
        this.mesh.position.z += y * speed;

        // Boundaries
        const halfWidth = STAGE_WIDTH / 2;
        const halfHeight = STAGE_HEIGHT / 2;

        // Clamp positions
        this.mesh.position.x = Math.max(-halfWidth, Math.min(halfWidth, this.mesh.position.x));
        this.mesh.position.z = Math.max(-halfHeight, Math.min(halfHeight, this.mesh.position.z));

        // Tilt effect
        this.mesh.rotation.z = -x * 0.5; // Bank turn

        // Shooting
        this.handleShooting(delta, input);
    }

    handleShooting(delta, input) {
        if (!this.shotTimer) this.shotTimer = 0;
        this.shotTimer += delta;

        if (input.isAction('SHOT') && this.shotTimer > 0.08) { // Rapid fire
            this.shotTimer = 0;
            if (this.bulletSystem) {
                // Dual shot
                this.bulletSystem.spawn(this.mesh.position.x - 0.5, this.mesh.position.y, this.mesh.position.z, 0, 0, -40);
                this.bulletSystem.spawn(this.mesh.position.x + 0.5, this.mesh.position.y, this.mesh.position.z, 0, 0, -40);

                // Audio is handled in Game.js via callback or we inject AudioManager?
                // For simplicity, let's keep Player clean and assume Game.js checks input for sound, OR inject.
                // Or Game.js updates audio when shot fired. 
                // We'll let Game.js handle the shot trigger sound for now to minimize Player deps.
            }
        }
    }

    // Setter for bullet system
    setBulletSystem(system) {
        this.bulletSystem = system;
    }
}
