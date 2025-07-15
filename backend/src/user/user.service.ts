import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService){}

    async findAll(){
        return this.prisma.user.findMany();
    }

    async create(name: string, email: string){
        return this.prisma.user.create({
            data: {name, email}
        })
    }

    async update(id: number, name: string, email: string) {
        return this.prisma.user.update({
            where: { id },
            data: {name, email}
        })
    }

    async delete(id: number) {
        return this.prisma.user.delete({
            where: { id }
        })
    }
}
