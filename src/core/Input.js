export const DEFAULT_KEYMAP = {
    UP: ['KeyW', 'ArrowUp'],
    DOWN: ['KeyS', 'ArrowDown'],
    LEFT: ['KeyA', 'ArrowLeft'],
    RIGHT: ['KeyD', 'ArrowRight'],
    SHOT: ['Space', 'KeyZ'],
    SLOW: ['ShiftLeft', 'ShiftRight'],
    BOMB: ['KeyE']
};

export class Input {
    constructor() {
        this.keys = {};
        // Load from local storage or use default
        const saved = localStorage.getItem('bd_keymap');
        this.keyMap = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_KEYMAP));

        // Forced update for Shot key change (ensure Space is present again)
        if (this.keyMap.SHOT && !this.keyMap.SHOT.includes('Space')) {
            this.keyMap.SHOT.push('Space');
            this.save();
        }

        // Forced update for Bomb key change if it's still the old default
        if (this.keyMap.BOMB && this.keyMap.BOMB[0] === 'KeyX') {
            this.keyMap.BOMB = ['KeyE'];
            this.save();
        }

        this.touchStart = null;
        this.touchCurrent = null;

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isAction(action) {
        const codes = this.keyMap[action];
        if (!codes) return false;
        return codes.some(code => this.keys[code]);
    }

    getAxis() {
        const x = (this.isAction('RIGHT') ? 1 : 0) - (this.isAction('LEFT') ? 1 : 0);
        const y = (this.isAction('DOWN') ? 1 : 0) - (this.isAction('UP') ? 1 : 0);
        return { x, y };
    }

    bind(action, code) {
        this.keyMap[action] = [code];
        this.save();
    }

    save() {
        localStorage.setItem('bd_keymap', JSON.stringify(this.keyMap));
    }
}
