import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { Response } from 'express';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { TradesService } from './trades.service';
import { TradeAnalysisService } from './trade-analysis.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { QueryTradeDto } from './dto/query-trade.dto';

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const name = `${uuid()}${extname(file.originalname)}`;
    cb(null, name);
  },
});

@Controller('trades')
@UseGuards(JwtAuthGuard)
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
    private readonly analysisService: TradeAnalysisService,
  ) {}

  @Post()
  create(@Req() req, @Body() dto: CreateTradeDto) {
    return this.tradesService.create(req.user.sub, dto);
  }

  @Post('import')
  bulkImport(@Req() req, @Body() body: { trades: CreateTradeDto[] }) {
    if (!Array.isArray(body.trades) || body.trades.length === 0) {
      return { imported: 0, failed: 0, errors: ['No trades provided'] };
    }
    if (body.trades.length > 500) {
      return { imported: 0, failed: 0, errors: ['Maximum 500 trades per import'] };
    }
    return this.tradesService.bulkImport(req.user.sub, body.trades);
  }

  @Get()
  findAll(@Req() req, @Query() query: QueryTradeDto) {
    return this.tradesService.findAll(req.user.sub, query);
  }

  @Get('analysis/insights')
  getInsights(@Req() req) {
    return this.analysisService.analyzeTrades(req.user.sub);
  }

  @Public()
  @Get('uploads/:filename')
  serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }
    return res.sendFile(filePath);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.tradesService.findOne(req.user.sub, id);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateTradeDto) {
    return this.tradesService.update(req.user.sub, id, dto);
  }

  @Put(':id/close')
  close(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { exitPrice: number; closedAt?: string },
  ) {
    return this.tradesService.close(req.user.sub, id, body.exitPrice, body.closedAt);
  }

  @Put(':id/review')
  review(@Req() req, @Param('id') id: string, @Body() body: { notes?: string }) {
    return this.tradesService.review(req.user.sub, id, body.notes);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.tradesService.remove(req.user.sub, id);
  }

  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @Req() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tradesService.addImage(req.user.sub, id, file);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Req() req,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.tradesService.removeImage(req.user.sub, id, imageId);
  }
}
