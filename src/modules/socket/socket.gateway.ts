import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({ cors: { origin: 'https://jogo-neurocooperacao-git-main-ghzoliveiras-projects.vercel.app', methods: ['GET', 'POST', 'PUT', 'PATCH'], credentials: true } })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameServers: Map<string, any> = new Map();
  private gameServerSockets: Map<string, Socket[]> = new Map();
  private messages: Record<string, string> = {};
  private gameRule: string = '';

  constructor(private prisma: PrismaService) { }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createGame')
  async handleCreateGame(client: Socket, groupId: string) {
    const group = await this.prisma.grupo.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      client.emit('error', 'Grupo não encontrado');
      return;
    }

    if (this.gameServers.has(groupId)) {
      client.emit('error', 'Já existe um servidor de jogo para este grupo');
      return;
    }

    const gameServer = new Server();
    this.gameServers.set(groupId, gameServer);

    await this.prisma.grupo.update({
      where: { id: groupId },
      data: { gameServerCreated: true },
    });

    gameServer.on('connection', (socket) => {
      console.log(`Usuário conectado ao servidor de jogo do grupo ${groupId}`);
    });

    console.log(`Servidor de jogo criado para o grupo ${groupId}`);
    client.emit('gameCreated', groupId);
  }

  @SubscribeMessage('testMessage')
  handleMessage(client: Socket, payload: string, groupId: string): void {
    const message = (this.messages[client.id] = payload);
    if (message) {
      console.log(
        `Emitindo 'storedMessage' para o cliente '${client.id}' com a mensagem: '${message}', `,
      );
      this.server.emit('storedMessage', message);
    }
    console.log(`Mensagem recebida do cliente ${client.id}}: ${payload}`);
  }

  @SubscribeMessage('nextRound')
  handleNextRound(client: Socket, groupId: string): void {
    const message = `Next round started for group ${groupId}`;
    this.messages[client.id] = message;
    this.server.emit('nextRoundStarted', groupId);

    console.log(`Message stored: ${message}`);
  }

  @SubscribeMessage('endGame')
  handleFinishGame(client: Socket, groupId: string): void {
    const message = `Acabou para o ${groupId}`;
    this.messages[client.id] = message;
    this.server.emit('Acabou', groupId);

    console.log(`Message stored: ${message}`);
  }

  @SubscribeMessage('sendGameRule')
  async handleGameRule(
    client: Socket,
    [gameRule, groupId]: [string, string],
  ): Promise<void> {
    console.log(`Regra do jogo recebida do cliente ${client.id}: ${gameRule}`);
    try {
      await this.prisma.grupo.update({
        where: { id: groupId },
        data: { gameRule: gameRule },
      });
      console.log(
        `Regra do jogo armazenada no banco de dados para a rodada ${groupId}`,
      );
      this.server.emit('gameRuleStored', gameRule);
    } catch (error) {
      console.error(
        `Erro ao armazenar a regra do jogo no banco de dados: ${error}`,
      );
      client.emit('error', 'Erro ao armazenar a regra do jogo');
    }
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, groupId: string): void {
    const message = this.messages[client.id];
    const gameServer = this.gameServers.get(groupId);

    if (message) {
      client.emit('storedMessage', message);
    }

    if (!gameServer) {
      client.emit('error', 'Servidor de jogo não encontrado');
      return;
    }
    if (!this.gameServerSockets.has(groupId)) {
      this.gameServerSockets.set(groupId, []);
    }
    this.gameServerSockets.get(groupId).push(client);

    gameServer.emit('newPlayer', client.id);
    console.log(
      `Usuário ${client.id} entrou no servidor de jogo do grupo ${groupId}`,
    );
  }

  @SubscribeMessage('startGame')
  handleStartGame(client: Socket, groupId: string) {
    const gameServer = this.gameServers.get(groupId);

    if (!gameServer) {
      client.emit('error', 'Servidor de jogo não encontrado');
      return;
    }

    const sockets = this.gameServerSockets.get(groupId);
    if (sockets) {
      sockets.forEach((socket: Socket) => {
        socket.emit('gameStarted');
      });
    }

    console.log(`Jogo iniciado para o grupo ${groupId}`);
  }
}
