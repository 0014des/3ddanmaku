export class UIManager {
    constructor(input) {
        this.input = input; // Reference to input for key binding
        this.Container = document.createElement('div');
        this.Container.id = 'ui-container';
        Object.assign(this.Container.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            pointerEvents: 'none', fontFamily: '"Courier New", monospace', userSelect: 'none'
        });
        document.body.appendChild(this.Container);

        this.screens = {};

        this.createHUD();
        this.createTitleScreen();
        this.createSettingsScreen();
        this.createPauseScreen();

        // Initial State
        this.showScreen('TITLE');
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.style.display = 'none';

        // Score
        this.scoreEl = document.createElement('div');
        Object.assign(this.scoreEl.style, {
            position: 'absolute', top: '20px', left: '20px',
            fontSize: '24px', color: '#fff', textShadow: '0 0 5px #0ff'
        });
        this.scoreEl.innerText = 'SCORE: 0';
        hud.appendChild(this.scoreEl);

        // Player HP
        this.hpEl = document.createElement('div');
        Object.assign(this.hpEl.style, {
            position: 'absolute', bottom: '20px', left: '20px',
            fontSize: '24px', color: '#0f0', fontWeight: 'bold'
        });
        this.hpEl.innerText = 'HP: ♥♥♥♥♥';
        hud.appendChild(this.hpEl);

        // Bomb
        this.bombEl = document.createElement('div');
        Object.assign(this.bombEl.style, {
            position: 'absolute', bottom: '50px', left: '20px',
            fontSize: '24px', color: '#00f', fontWeight: 'bold', textShadow: '0 0 5px #00f'
        });
        this.bombEl.innerText = 'BOMB: ★★★';
        hud.appendChild(this.bombEl);

        // Boss HP (Minecraft Style)
        this.bossHpEl = document.createElement('div');
        Object.assign(this.bossHpEl.style, {
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            width: '600px', textAlign: 'center', display: 'none',
            textShadow: '2px 2px 0 #000', fontWeight: 'bold', fontSize: '20px', color: '#fff'
        });

        const barContainer = document.createElement('div');
        Object.assign(barContainer.style, {
            width: '100%', height: '20px', background: '#333',
            border: '2px solid #fff', marginTop: '5px', position: 'relative'
        });

        const barFill = document.createElement('div');
        barFill.id = 'boss-bar';
        Object.assign(barFill.style, {
            width: '100%', height: '100%',
            background: 'linear-gradient(to right, #a0a, #f0f)',
            transition: 'width 0.2s'
        });

        barContainer.appendChild(barFill);
        this.bossHpEl.innerHTML = '<div>DOOM CONE</div>';
        this.bossHpEl.appendChild(barContainer);
        hud.appendChild(this.bossHpEl);

        this.Container.appendChild(hud);
        this.screens['HUD'] = hud;
    }

    createTitleScreen() {
        const title = document.createElement('div');
        Object.assign(title.style, {
            width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto', color: '#fff'
        });

        const h1 = document.createElement('h1');
        h1.innerText = 'BULLET DIMENSION';
        h1.style.fontSize = '60px';
        h1.style.textShadow = '0 0 20px #0ff';
        title.appendChild(h1);

        const startBtn = this.createButton('START GAME', () => this.onStart());
        const settingBtn = this.createButton('SETTINGS', () => this.showScreen('SETTINGS'));

        title.appendChild(startBtn);
        title.appendChild(settingBtn);

        this.Container.appendChild(title);
        this.screens['TITLE'] = title;
    }

    createSettingsScreen() {
        const settings = document.createElement('div');
        Object.assign(settings.style, {
            width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)',
            display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto', color: '#fff'
        });

        const h2 = document.createElement('h2');
        h2.innerText = 'SETTINGS (Click to Bind)';
        settings.appendChild(h2);

        this.keyButtons = {};
        const actions = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'SHOT', 'SLOW', 'BOMB'];

        const getKeyString = (action) => {
            if (this.input && this.input.keyMap && this.input.keyMap[action]) {
                return this.input.keyMap[action].join(', ');
            }
            return '...';
        };

        actions.forEach(action => {
            const row = document.createElement('div');
            row.style.margin = '10px';
            row.style.fontSize = '20px';

            const label = document.createElement('span');
            label.innerText = `${action}: `;

            const btn = document.createElement('button');
            btn.innerText = getKeyString(action);
            Object.assign(btn.style, {
                background: '#333', color: '#fff', border: '1px solid #777',
                padding: '5px 10px', marginLeft: '10px', cursor: 'pointer', fontFamily: 'inherit'
            });

            btn.onclick = () => this.startBinding(action, btn);

            row.appendChild(label);
            row.appendChild(btn);
            settings.appendChild(row);
            this.keyButtons[action] = btn;
        });

        // Debug Hitbox Toggle
        const debugRow = document.createElement('div');
        debugRow.style.margin = '10px';
        debugRow.style.fontSize = '20px';
        debugRow.innerHTML = '<span>DEBUG HITBOX: </span>';
        const debugBtn = document.createElement('button');
        debugBtn.innerText = 'OFF';
        Object.assign(debugBtn.style, {
            background: '#333', color: '#fff', border: '1px solid #777',
            padding: '5px 10px', marginLeft: '10px', cursor: 'pointer', fontFamily: 'inherit'
        });
        debugBtn.onclick = () => {
            const state = debugBtn.innerText === 'OFF' ? 'ON' : 'OFF';
            debugBtn.innerText = state;
            if (this.onDebugToggle) this.onDebugToggle(state === 'ON');
        };
        debugRow.appendChild(debugBtn);
        settings.appendChild(debugRow);
        this.debugBtn = debugBtn;

        const backBtn = this.createButton('BACK', () => this.showScreen('TITLE'));
        backBtn.style.marginTop = '30px';
        settings.appendChild(backBtn);

        this.Container.appendChild(settings);
        this.screens['SETTINGS'] = settings;
    }

    createPauseScreen() {
        const pause = document.createElement('div');
        Object.assign(pause.style, {
            width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)',
            display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto', color: '#fff', backdropFilter: 'blur(5px)'
        });

        const h2 = document.createElement('h2');
        h2.innerText = 'PAUSED';
        pause.appendChild(h2);

        const resumeBtn = this.createButton('RESUME', () => this.onResume());
        const titleBtn = this.createButton('TITLE', () => {
            this.showScreen('TITLE');
            if (this.onGoTitle) this.onGoTitle();
        });

        pause.appendChild(resumeBtn);
        pause.appendChild(titleBtn);

        this.Container.appendChild(pause);
        this.screens['PAUSE'] = pause;
    }

    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            background: 'transparent', color: '#fff', border: '2px solid #fff',
            padding: '10px 30px', margin: '10px', fontSize: '24px', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s'
        });
        btn.onmouseover = () => { btn.style.background = '#fff'; btn.style.color = '#000'; };
        btn.onmouseout = () => { btn.style.background = 'transparent'; btn.style.color = '#fff'; };
        btn.onclick = onClick;
        return btn;
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => s.style.display = 'none');
        if (name === 'PLAYING') {
            this.screens['HUD'].style.display = 'block';
        } else if (this.screens[name]) {
            this.screens[name].style.display = 'flex';
        }
    }

    startBinding(action, btnEl) {
        btnEl.innerText = 'Press Any Key...';
        btnEl.style.background = '#f00';

        const handler = (e) => {
            e.preventDefault();
            const code = e.code;
            if (this.input) this.input.bind(action, code);
            btnEl.innerText = code;
            btnEl.style.background = '#333';
        };
        window.addEventListener('keydown', handler, { once: true });
    }

    addScore(points) {
        const cur = parseInt(this.scoreEl.innerText.split(' ')[1]);
        this.scoreEl.innerText = `SCORE: ${cur + points}`;
    }

    updatePlayerHP(hp) {
        let hearts = '';
        for (let i = 0; i < Math.max(0, hp); i++) hearts += '♥';
        this.hpEl.innerText = `HP: ${hearts}`;
        this.hpEl.style.color = hp <= 1 ? '#f00' : '#0f0';
    }

    updateBomb(count) {
        let stars = '';
        for (let i = 0; i < Math.max(0, count); i++) stars += '★';
        this.bombEl.innerText = `BOMB: ${stars}`;
    }

    showBossHP(visible) {
        this.bossHpEl.style.display = visible ? 'block' : 'none';
    }

    updateBossHP(current, max) {
        const percent = Math.max(0, (current / max) * 100);
        const bar = document.getElementById('boss-bar');
        if (bar) bar.style.width = `${percent}%`;
    }
}
