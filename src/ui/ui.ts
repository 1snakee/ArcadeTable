import { GameManager } from '../logic/gameState';
import { BaccaratGameManager } from '../logic/baccaratGameManager';
import { RouletteGameManager } from '../logic/rouletteGameManager';
import { BackgroundManager } from './background';
import { Ledger } from '../logic/ledger';
import { SetupScreen, type SetupConfig } from './screens/setup';
import { TableScreen } from './screens/table';
import { BaccaratTableScreen } from './screens/baccaratTable';
import { RouletteTableScreen } from './screens/rouletteTable';

export class UI {
    game: GameManager;
    baccaratGame: BaccaratGameManager;
    rouletteGame: RouletteGameManager;
    ledger: Ledger;
    app: HTMLElement;
    currentScreen: any = null;
    background: BackgroundManager;

    constructor() {
        this.background = new BackgroundManager();
        this.game = new GameManager();
        this.baccaratGame = new BaccaratGameManager();
        this.ledger = new Ledger();
        this.rouletteGame = new RouletteGameManager(this.ledger);
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
        } else if (config.gameType === 'BACCARAT') {
            // Setup Baccarat
            this.baccaratGame.players = [];
            this.baccaratGame.bets.clear();
            config.players.forEach(name => this.baccaratGame.addPlayer(name));

            // Set Dealer (use selected index or default to first)
            const playerIds = this.baccaratGame.players.map(p => p.id);
            this.baccaratGame.dealerId = playerIds[config.dealerIndex] || playerIds[0];

            this.baccaratGame.startGame();
            this.showBaccaratTable();
        } else if (config.gameType === 'ROULETTE') {
            // Setup Roulette
            this.rouletteGame.players = [];
            config.players.forEach(name => this.rouletteGame.addPlayer(name));

            // Set Dealer
            const playerIds = this.rouletteGame.players.map(p => p.id);
            this.rouletteGame.setDealer(playerIds[config.dealerIndex] || playerIds[0]);

            this.showRouletteTable();
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

    showRouletteTable() {
        this.clearScreen();
        this.background.setMode('TABLE');
        this.currentScreen = new RouletteTableScreen(this.app, this.rouletteGame, this.ledger, () => this.showSetup());
    }

    clearScreen() {
        if (this.currentScreen && this.currentScreen.cleanup) {
            this.currentScreen.cleanup();
        }
        this.app.innerHTML = '';
    }
}
