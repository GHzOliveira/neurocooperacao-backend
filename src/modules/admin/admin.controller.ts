import { Controller, Get, Query, Res } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('login')
    async login(@Query('user') user: string, @Query('password') password: string) {
        const admin = await this.adminService.findAdmin(user, password)
        if (admin) {
            return { status: 200, message: 'Admin found', data: admin }
        }
        return { status: 404, message: 'Admin not found' }
    }
}