import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseService {
  create() {
    return 'This action adds a new base';
  }

  findAll() {
    return `This action returns all base`;
  }

  findOne(id: number) {
    return `This action returns a #${id} base`;
  }

  update(id: number) {
    return `This action updates a #${id} base`;
  }

  remove(id: number) {
    return `This action removes a #${id} base`;
  }
}
