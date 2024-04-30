import { Socket } from "socket.io";

export class GameServer {
    private gameId: string;
    private players: Map<string, any>;

    constructor(gameId: string) {
        this.gameId = gameId;
        this.players = new Map();
    }

    startRound() {
        for (const playerSocket of this.players.values()) {
            playerSocket.emit('roundStarted', this.gameId);
        }
        console.log(`Rodada iniciada no servidor de jogo do grupo ${this.gameId}`);
    }

    addPlayer(playerId: string, playerSocket: Socket) {
        this.players.set(playerId, playerSocket);
    }

    removePlayer(playerId: string) {
        this.players.delete(playerId);
    }
}
