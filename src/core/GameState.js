export const STATE = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    SETTINGS: 'SETTINGS',
    GAMEOVER: 'GAMEOVER'
};

export class GameState {
    constructor() {
        this.current = STATE.TITLE;
    }

    set(state) {
        this.current = state;
    }

    is(state) {
        return this.current === state;
    }
}
