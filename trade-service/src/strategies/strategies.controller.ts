import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Controller('strategies')
@UseGuards(JwtAuthGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateStrategyDto) {
    return this.strategiesService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req, @Query('active') active?: string) {
    const activeOnly = active === 'true' ? true : active === 'false' ? false : undefined;
    return this.strategiesService.findAll(req.user.sub, activeOnly);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.strategiesService.findOne(req.user.sub, id);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateStrategyDto) {
    return this.strategiesService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.strategiesService.remove(req.user.sub, id);
  }
}
