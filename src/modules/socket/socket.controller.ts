import { Controller, Get } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";

@Controller('gameServers')
export class SocketController {
    constructor(private socketGateway: SocketGateway) {}
}