import { PLAYER_HITBOX } from '../constants.js';

export class CollisionSystem {
    constructor(player, bulletSystem) {
        this.player = player;
        this.bulletSystem = bulletSystem;
        this.bulletRadius = 0.3; // Match geometry
        this.hitDistSq = Math.pow(PLAYER_HITBOX + this.bulletRadius, 2);
    }

    update(enemies) {
        if (!this.player.mesh) return;
        this.enemies = enemies || [];

        const pPos = this.player.mesh.position;
        const positions = this.bulletSystem.positions;
        const active = this.bulletSystem.active;
        const max = this.bulletSystem.maxBullets;

        // Bullet Collision
        for (let i = 0; i < max; i++) {
            if (active[i] === 0) continue;

            const idx = i * 3;
            const bx = positions[idx];
            const by = positions[idx + 1];
            const bz = positions[idx + 2];

            const dx = pPos.x - bx;
            const dy = pPos.y - by;
            const dz = pPos.z - bz;

            // Simple Sphere check
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < this.hitDistSq) {
                this.onHit(i);
            }
        }

        // Body Collision
        this.checkBodyCollision(this.player, this.enemies);
    }

    checkBodyCollision(player, enemies) {
        if (!player.active) return;
        const pPos = player.mesh.position;
        const pRadius = 0.5; // Player radius

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.active) continue;

            const ePos = enemy.mesh.position;
            // Radius depends on enemy roughly
            // Boss is huge, Zako is small. But logic is generic for now.
            // Let's assume Box/Sphere hybrid or large sphere for Boss.
            const eRadius = enemy.mesh.geometry.parameters.radius || 1.0;

            const distSq = pPos.distanceToSquared(ePos);
            if (distSq < (pRadius + eRadius) * (pRadius + eRadius)) {
                if (player.takeDamage) player.takeDamage();
            }
        }
    }

    onHit(bulletIndex) {
        // console.log("Hit!");
        // Deactivate bullet
        this.bulletSystem.active[bulletIndex] = 0;
        this.bulletSystem.dummy.position.set(0, -1000, 0);
        this.bulletSystem.dummy.updateMatrix();
        this.bulletSystem.mesh.setMatrixAt(bulletIndex, this.bulletSystem.dummy.matrix);
        this.bulletSystem.mesh.instanceMatrix.needsUpdate = true;

        if (this.player.takeDamage) this.player.takeDamage();
    }

    checkPlayerShots(playerBulletSystem, enemies, uiManager) {
        const pBullets = playerBulletSystem;
        const positions = pBullets.positions;
        const active = pBullets.active;
        const max = pBullets.maxBullets;
        const enemyRadiusSq = 1.5 * 1.5; // Approx for generic hit

        for (let i = 0; i < max; i++) {
            if (active[i] === 0) continue;

            const idx = i * 3;
            const bx = positions[idx];
            const bz = positions[idx + 2];

            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                if (!enemy.active) continue;

                // Boss might be bigger.
                let hitRadiusSq = enemyRadiusSq;
                if (enemy.maxHp > 100) hitRadiusSq = 3.0 * 3.0; // Bigger hitbox for boss

                const ex = enemy.mesh.position.x;
                const ez = enemy.mesh.position.z;

                const dx = bx - ex;
                const dz = bz - ez;

                if (dx * dx + dz * dz < hitRadiusSq) {
                    enemy.takeDamage(1);
                    if (enemy.uiManager && enemy.maxHp) {
                        enemy.uiManager.updateBossHP(enemy.hp, enemy.maxHp);
                    } else if (enemy.hp <= 0 && uiManager) {
                        uiManager.addScore(100);
                    }

                    pBullets.active[i] = 0;
                    pBullets.dummy.position.set(0, -1000, 0);
                    pBullets.dummy.updateMatrix();
                    pBullets.mesh.setMatrixAt(i, pBullets.dummy.matrix);

                    break;
                }
            }
        }
        pBullets.mesh.instanceMatrix.needsUpdate = true;
    }
}
