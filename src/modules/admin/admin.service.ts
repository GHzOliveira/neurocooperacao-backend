import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async findAdmin(user: string, password: string) {
        return this.prisma.admin.findUnique({
            where: { user, password }
        })
    }
}