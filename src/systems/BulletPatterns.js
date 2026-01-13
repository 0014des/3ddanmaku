import * as THREE from 'three';

export class BulletPatterns {
    constructor(bulletSystem) {
        this.bulletSystem = bulletSystem;
    }

    // --- Helpers ---
    spawn(x, y, z, vx, vy, vz) {
        this.bulletSystem.spawn(x, y, z, vx, vy, vz);
    }

    getVectorToTarget(origin, target, speed) {
        const dx = target.x - origin.x;
        const dz = target.z - origin.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len === 0) return { x: 0, z: speed };

        return {
            x: (dx / len) * speed,
            z: (dz / len) * speed
        };
    }

    // --- Basic Patterns ---

    fireSpiral(origin, time) {
        const count = 3;
        const speed = 8;
        const angleBase = time * 2;

        for (let i = 0; i < count; i++) {
            const angle = angleBase + (Math.PI * 2 * i) / count;
            const vx = Math.sin(angle) * speed;
            const vz = Math.cos(angle) * speed;
            this.spawn(origin.x, origin.y, origin.z, vx, 0, vz);
        }
    }

    // --- Cave Style (Pressure / Aiming) ---

    // Shoots directly at the target (Player)
    fireAimed(origin, target) {
        const speed = 12;
        const v = this.getVectorToTarget(origin, target, speed);
        this.spawn(origin.x, origin.y, origin.z, v.x, 0, v.z);
    }

    // N-Way: Fan shape shot aimed at target
    fireNWay(origin, target, count, spreadAngle) {
        const speed = 10;
        const v = this.getVectorToTarget(origin, target, speed);
        const baseAngle = Math.atan2(v.x, v.z); // Note: atan2(x, z) because Z is "forward" in our logic often, but checks math

        // Math.atan2(y, x) is standard. Here Z is like Y on screen (depth).
        // Let's stick to standard trig: X is horizontal, Z is vertical.
        // angle = atan2(x, z) -> 0 is +Z, PI/2 is +X.

        const startAngle = baseAngle - spreadAngle / 2;
        const step = spreadAngle / (count - 1);

        for (let i = 0; i < count; i++) {
            const angle = startAngle + step * i;
            const vx = Math.sin(angle) * speed;
            const vz = Math.cos(angle) * speed;
            this.spawn(origin.x, origin.y, origin.z, vx, 0, vz);
        }
    }

    // Wave: Linear sweep
    fireWave(origin, time) {
        const speed = 8;
        const angle = Math.sin(time * 3) * 0.5; // Oscillate direction
        const vx = Math.sin(angle) * speed;
        const vz = Math.cos(angle) * speed;
        this.spawn(origin.x, origin.y, origin.z, vx, 0, vz); // Shoot "forward" with wave
        // Wait, "Wave" in Cave games often means lines of bullets sweeping.
        // This implementation shoots a stream that waves.
    }

    // --- Touhou Style (Beauty / Geometry) ---

    // Omni: All directions
    fireOmni(origin, count, speed = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const vx = Math.sin(angle) * speed;
            const vz = Math.cos(angle) * speed;
            this.spawn(origin.x, origin.y, origin.z, vx, 0, vz);
        }
    }

    // Flower: Modulated radius/speed or angle
    fireFlower(origin, count, time) {
        const speedBase = 6;
        for (let i = 0; i < count; i++) {
            const baseAngle = (Math.PI * 2 * i) / count + time * 0.5;
            // Modulate speed or offset to augment pattern
            const mod = Math.sin(baseAngle * 5) * 2; // 5 petals
            const speed = speedBase + mod;

            const vx = Math.sin(baseAngle) * speed;
            const vz = Math.cos(baseAngle) * speed;
            this.spawn(origin.x, origin.y, origin.z, vx, 0, vz);
        }
    }
}
