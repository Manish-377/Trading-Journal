import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MistakesService } from './mistakes.service';
import { CreateMistakeDto } from './dto/create-mistake.dto';
import { UpdateMistakeDto } from './dto/update-mistake.dto';
import { QueryMistakeDto } from './dto/query-mistake.dto';

@Controller('mistakes')
@UseGuards(JwtAuthGuard)
export class MistakesController {
  constructor(private readonly mistakesService: MistakesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateMistakeDto) {
    return this.mistakesService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req, @Query() query: QueryMistakeDto) {
    return this.mistakesService.findAll(req.user.sub, query);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.mistakesService.getStats(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.mistakesService.findOne(req.user.sub, id);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateMistakeDto) {
    return this.mistakesService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.mistakesService.remove(req.user.sub, id);
  }
}
