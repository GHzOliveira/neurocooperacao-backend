import { Controller, Get, Query, Res } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Response } from 'express';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('login')
    async login(@Query('user') user: string, @Query('password') password: string, @Res() res: Response) {
        const admin = await this.adminService.findAdmin(user, password)
        if (admin) {
            res.header('Access-Control-Allow-Origin', 'https://jogo-neurocooperacao.vercel.app');
            res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.json({ status: 200, message: 'Admin found', data: admin });
        } else {
            res.json({ status: 404, message: 'Admin not found' });
        }
    }
}