import './style.css'
import { Game } from './core/Game.js'

window.addEventListener('DOMContentLoaded', () => {
    console.log("Bullet Dimension Loading...");
    const game = new Game();
    game.start();
});
