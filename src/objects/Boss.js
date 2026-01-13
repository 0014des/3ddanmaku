import * as THREE from 'three';
import { Enemy } from './Enemy.js';

export class Boss extends Enemy {
    constructor(scene, bulletPatterns, uiManager) {
        super(scene, bulletPatterns, 0, 0, -25);
        this.uiManager = uiManager;

        this.hp = 500;
        this.maxHp = 500;
        this.name = "DOOM CONE";

        // Visual (Bigger)
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.IcosahedronGeometry(3.0);
        this.mesh.material.color.setHex(0xff0000);
        this.mesh.position.set(0, 0, -20);

        // Update Hitbox to Box
        if (this.hitbox) {
            this.mesh.remove(this.hitbox);
        }
        const hitGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(4.0, 4.0, 4.0)); // Even bigger for boss
        const hitMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.hitbox = new THREE.LineSegments(hitGeo, hitMat);
        this.hitbox.visible = false;
        this.mesh.add(this.hitbox);

        this.phase = 0;
        this.phaseTimer = 0;
        this.onPhaseChange = null;
    }

    update(delta, playerPos) {
        if (!this.active) return;

        this.time += delta;
        this.phaseTimer += delta;

        // Boss Movement (Figure 8)
        this.mesh.position.x = Math.sin(this.time * 0.5) * 10;
        this.mesh.position.z = -20 + Math.sin(this.time) * 5;

        // Rotation
        this.mesh.rotation.y += delta;
        this.mesh.rotation.x += delta * 0.5;

        // Check Phase Change
        let newPhase = 1;
        if (this.hp > 350) newPhase = 1;
        else if (this.hp > 150) newPhase = 2;
        else newPhase = 3;

        if (this.phase !== newPhase && this.phase !== 0) {
            console.log("Boss Phase Change:", newPhase);
            if (this.onPhaseChange) this.onPhaseChange(newPhase);
        }
        this.phase = newPhase;

        // Phase Logic
        this.executePhase(delta, playerPos);
    }

    executePhase(delta, playerPos) {
        this.fireTimer += delta;

        // Phase 1: Spiral (HP > 70%)
        if (this.phase === 1) {
            if (this.fireTimer > 0.15) {
                this.bulletPatterns.fireSpiral(this.mesh.position, this.time);
                this.fireTimer = 0;
            }
        }
        // Phase 2: N-Way + Aimed (HP > 30%)
        else if (this.phase === 2) {
            if (this.fireTimer > 0.4) {
                this.bulletPatterns.fireNWay(this.mesh.position, playerPos, 7, Math.PI / 2);
                this.bulletPatterns.fireAimed(this.mesh.position, playerPos);
                this.fireTimer = 0;
            }
        }
        // Phase 3: Flower + Wave (Madness)
        else {
            if (this.fireTimer > 0.1) {
                this.bulletPatterns.fireFlower(this.mesh.position, 12, this.time);
                if (Math.random() < 0.1) this.bulletPatterns.fireWave(this.mesh.position, this.time);
                this.fireTimer = 0;
            }
        }
    }
}
