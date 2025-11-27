import { GameManager } from '../logic/gameState';
import { BaccaratGameManager } from '../logic/baccaratGameManager';
import { BackgroundManager } from './background';
import { Ledger } from '../logic/ledger';
import { SetupScreen, type SetupConfig } from './screens/setup';
import { TableScreen } from './screens/table';
import { BaccaratTableScreen } from './screens/baccaratTable';

export class UI {
    game: GameManager;
    baccaratGame: BaccaratGameManager;
    ledger: Ledger;
    app: HTMLElement;
    currentScreen: any = null;
    background: BackgroundManager;

    constructor() {
        this.background = new BackgroundManager();
        this.game = new GameManager();
        this.baccaratGame = new BaccaratGameManager();
        this.ledger = new Ledger();
        this.app = document.getElementById('app')!;
        this.showSetup();
    }

    showSetup() {
        this.clearScreen();
        this.background.setMode('SETUP');
        this.currentScreen = new SetupScreen(this.app, (config: SetupConfig) => this.handleGameStart(config));
    }

    handleGameStart(config: SetupConfig) {
        if (config.gameType === 'BLACKJACK') {
            // Setup Blackjack
            this.game.state.players = [];
            config.players.forEach(name => this.game.addPlayer(name));
            const playerIds = this.game.state.players.map(p => p.id);
            this.game.setDealer(playerIds[config.dealerIndex]);
            this.game.startGame();
            this.showTable();
        } else {
            // Setup Baccarat
            this.baccaratGame.players = [];
            this.baccaratGame.bets.clear();
            config.players.forEach(name => this.baccaratGame.addPlayer(name));

            // Set Dealer (use selected index or default to first)
            const playerIds = this.baccaratGame.players.map(p => p.id);
            this.baccaratGame.dealerId = playerIds[config.dealerIndex] || playerIds[0];

            this.baccaratGame.startGame();
            this.showBaccaratTable();
        }
    }

    showTable() {
        this.clearScreen();
        this.background.setMode('TABLE');
        this.currentScreen = new TableScreen(this.app, this.game, this.ledger, () => this.showSetup());
    }

    showBaccaratTable() {
        this.clearScreen();
        this.background.setMode('TABLE');
        this.currentScreen = new BaccaratTableScreen(this.app, this.baccaratGame, this.ledger, () => this.showSetup());
    }

    clearScreen() {
        if (this.currentScreen && this.currentScreen.cleanup) {
            this.currentScreen.cleanup();
        }
        this.app.innerHTML = '';
    }
}
