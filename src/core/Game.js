import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';
import { Input } from './Input.js';
import { GameState, STATE } from './GameState.js';
import { Player } from '../objects/Player.js';
import { BulletSystem } from '../objects/BulletSystem.js';
import { BulletPatterns } from '../systems/BulletPatterns.js';
import { CollisionSystem } from '../systems/Collision.js';
import { Enemy } from '../objects/Enemy.js';
import { Boss } from '../objects/Boss.js';
import { UIManager } from '../ui/UIManager.js';
import { AudioManager } from '../systems/AudioManager.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // State
        this.state = new GameState();

        // Audio
        this.audio = new AudioManager();

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.03);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 30, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance", antialias: false, stencil: false, depth: false });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Post Processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new EffectPass(this.camera, new BloomEffect({ intensity: 1.5, luminanceThreshold: 0.1, radius: 0.6 })));

        // Background
        this.setupScene();

        // System Init
        this.input = new Input();
        this.clock = new THREE.Clock();

        // UI
        this.ui = new UIManager(this.input);
        this.ui.onStart = () => this.startGame();
        this.ui.onResume = () => this.resumeGame();
        this.ui.onGoTitle = () => this.toTitle();
        this.ui.onDebugToggle = (active) => {
            this.debugMode = active;
            this.player.setHitboxVisible(this.debugMode);
            if (this.bulletSystem) this.bulletSystem.setDebugVisible(this.debugMode);
            this.enemies.forEach(e => { if (e.hitbox) e.hitbox.visible = this.debugMode; });
        };

        // Systems
        this.bulletSystem = new BulletSystem(this.scene, { color: 0xff55ff, size: 0.8, maxBullets: 5000 });
        this.bulletPatterns = new BulletPatterns(this.bulletSystem);
        this.playerShotSystem = new BulletSystem(this.scene, { color: 0x55ffff, size: 0.5, maxBullets: 1000 });

        // Objects
        this.player = new Player(this.scene);
        this.player.setBulletSystem(this.playerShotSystem);
        this.enemies = [];

        this.collisionSystem = new CollisionSystem(this.player, this.bulletSystem);
        this.collisionSystem.uiManager = this.ui;

        this.debugMode = false;
        this.godMode = false;

        // Events
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.state.is(STATE.PLAYING)) this.pauseGame();
                else if (this.state.is(STATE.PAUSED)) this.resumeGame();
            }
            if (e.code === 'KeyH' || e.code === 'Digit1') {
                console.log("Toggle Hitbox Triggered");
                this.debugMode = !this.debugMode;
                this.player.setHitboxVisible(this.debugMode);
                this.bulletSystem.setDebugVisible(this.debugMode);
                this.enemies.forEach(enemy => {
                    if (enemy.hitbox) enemy.hitbox.visible = this.debugMode;
                });
                // Sync UI Button
                if (this.ui.debugBtn) this.ui.debugBtn.innerText = this.debugMode ? 'ON' : 'OFF';
            }
            // Hidden Command: 'O' key for God Mode
            if (e.code === 'KeyO') {
                this.godMode = !this.godMode;
                console.log("GOD MODE:", this.godMode ? "ON" : "OFF");
                if (this.godMode) {
                    this.player.hp = 999;
                    this.player.bomb = 999;
                    this.ui.updatePlayerHP(999);
                    this.ui.updateBomb(999);
                    this.player.mesh.material.color.setHex(0xffff00);
                } else {
                    this.player.hp = 5;
                    this.player.bomb = 3;
                    this.ui.updatePlayerHP(5);
                    this.ui.updateBomb(3);
                    this.player.mesh.material.color.setHex(0x00ff00);
                }
            }
        });

        // Loop Bind
        this.render = this.render.bind(this);
    }

    setupScene() {
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        const gridHelper = new THREE.GridHelper(200, 40, 0x444488, 0x222233);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);
        this.grid = gridHelper;

        const starGeo = new THREE.BufferGeometry();
        const starCount = 1000;
        const posArray = new Float32Array(starCount * 3);
        const starMat = new THREE.PointsMaterial({ size: 0.5, color: 0xffffff });
        for (let i = 0; i < starCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 200;
        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        this.stars = new THREE.Points(starGeo, starMat);
        this.stars.position.y = -10;
        this.scene.add(this.stars);
    }

    start() {
        this.render();
    }

    startGame() {
        this.audio.startBgm();
        this.state.set(STATE.PLAYING);
        this.ui.showScreen('PLAYING');
        this.resetGame();
    }

    pauseGame() {
        this.state.set(STATE.PAUSED);
        this.ui.showScreen('PAUSE');
    }

    resumeGame() {
        this.state.set(STATE.PLAYING);
        this.ui.showScreen('PLAYING');
        this.audio.startBgm();
    }

    toTitle() {
        this.state.set(STATE.TITLE);
        this.ui.showScreen('TITLE');
        this.enemies.forEach(e => e.deactivate());
        this.enemies = [];
        this.bulletSystem.active.fill(0);
        this.bulletSystem.mesh.instanceMatrix.needsUpdate = true;
        this.bulletSystem.debugMesh.instanceMatrix.needsUpdate = true;
        this.audio.stopBgm();
    }

    resetGame() {
        this.player.hp = 5;
        this.player.bomb = 3;
        this.player.active = true;
        this.player.invulnerableTime = 0;
        this.godMode = false;

        this.ui.updatePlayerHP(5);
        this.ui.updateBomb(3);
        this.player.mesh.material.color.setHex(0x00ff00);

        this.ui.addScore(0);

        this.enemies.forEach(e => e.deactivate());
        this.enemies = [];

        this.bulletSystem.active.fill(0);
        this.bulletSystem.mesh.instanceMatrix.needsUpdate = true;
        this.bulletSystem.debugMesh.instanceMatrix.needsUpdate = true;
        this.playerShotSystem.active.fill(0);
        this.playerShotSystem.mesh.instanceMatrix.needsUpdate = true;

        this.spawnBoss();

        this.player.takeDamage = () => {
            if (this.player.invulnerableTime > 0 || this.godMode) return;

            this.audio.playExplosion();
            this.player.hp--;
            this.player.invulnerableTime = 2.0;
            this.ui.updatePlayerHP(this.player.hp);

            if (this.player.hp <= 0) {
                this.player.active = false;
                this.ui.showBossHP(false);
                setTimeout(() => this.resetGame(), 2000);
            }
        };
    }

    spawnBoss() {
        this.boss = new Boss(this.scene, this.bulletPatterns, this.ui);
        if (this.debugMode && this.boss.hitbox) this.boss.hitbox.visible = true;

        this.boss.onPhaseChange = () => {
            this.clearEnemyBullets();
            this.flashScreen(0.2);
        };

        this.enemies.push(this.boss);
        this.ui.showBossHP(true);
        this.ui.updateBossHP(this.boss.hp, this.boss.maxHp);
    }

    clearEnemyBullets() {
        if (!this.bulletSystem) return;
        this.bulletSystem.active.fill(0);
        this.bulletSystem.dummy.position.set(0, -1000, 0);
        for (let i = 0; i < this.bulletSystem.maxBullets; i++) {
            this.bulletSystem.mesh.setMatrixAt(i, this.bulletSystem.dummy.matrix);
            this.bulletSystem.debugMesh.setMatrixAt(i, this.bulletSystem.dummy.matrix);
        }
        this.bulletSystem.mesh.instanceMatrix.needsUpdate = true;
        this.bulletSystem.debugMesh.instanceMatrix.needsUpdate = true;
    }

    flashScreen(intensity = 0.8) {
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: '#fff', opacity: intensity.toString(), transition: 'opacity 0.5s', pointerEvents: 'none', zIndex: '999'
        });
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; }, 50);
        setTimeout(() => { flash.remove(); }, 550);
    }

    useBomb() {
        if (!this.player.active || (this.player.bomb <= 0 && !this.godMode)) return;

        this.audio.playBomb();

        if (!this.godMode) {
            this.player.bomb--;
            this.ui.updateBomb(this.player.bomb);
        }

        this.clearEnemyBullets();
        this.flashScreen(0.8);

        this.enemies.forEach(e => {
            if (e.active) {
                e.takeDamage(50);
                if (e.uiManager && e.maxHp) e.uiManager.updateBossHP(e.hp, e.maxHp);
            }
        });
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
    }

    update(delta) {
        const speed = 10 * delta;
        this.grid.position.z = (this.grid.position.z + speed) % 5;
        this.stars.position.z = (this.stars.position.z + speed * 0.5) % 100;

        if (!this.state.is(STATE.PLAYING)) return;

        if (this.input.isAction('SHOT')) {
            if (!this.shotSoundTimer) this.shotSoundTimer = 0;
            this.shotSoundTimer += delta;
            if (this.shotSoundTimer > 0.08) {
                this.audio.playShoot();
                this.shotSoundTimer = 0;
            }
        }

        if (this.input.isAction('BOMB') && !this.bombPressed) {
            this.useBomb();
            this.bombPressed = true;
        }
        if (!this.input.isAction('BOMB')) this.bombPressed = false;

        if (this.player.invulnerableTime > 0) {
            this.player.invulnerableTime -= delta;
            this.player.mesh.visible = Math.floor(this.player.invulnerableTime * 15) % 2 === 0;
        } else {
            this.player.mesh.visible = true;
        }
        this.player.update(delta, this.input);

        if (!this.zakoTimer) this.zakoTimer = 0;
        this.zakoTimer += delta;
        if (this.zakoTimer > 3.0) {
            this.zakoTimer = 0;
            const x = (Math.random() - 0.5) * 30;
            const enemy = new Enemy(this.scene, this.bulletPatterns, x, 0, -30);
            if (this.debugMode) enemy.hitbox.visible = true;
            this.enemies.push(enemy);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta, this.player.mesh.position);
            if (!enemy.active) {
                this.enemies.splice(i, 1);
                if (enemy === this.boss) {
                    this.clearEnemyBullets(); // Clear on defeat too
                    this.ui.showBossHP(false);
                    setTimeout(() => this.spawnBoss(), 3000);
                }
            }
        }

        this.playerShotSystem.update(delta);
        this.bulletSystem.update(delta);

        this.collisionSystem.update(this.enemies);
        this.collisionSystem.checkPlayerShots(this.playerShotSystem, this.enemies, this.ui);
    }

    render() {
        requestAnimationFrame(this.render);
        const delta = this.clock.getDelta();
        this.update(delta);
        this.composer.render();
    }
}
