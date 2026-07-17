import {
  BadRequestException,
  Body,
  Controller,
  Get,
  PayloadTooLargeException,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser } from '@saki-operations/types';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SyncBatchDto, SyncDeltaQueryDto, SyncEventDto } from './dto/sync.dto';
import {
  SYNC_MAX_BATCH_EVENTS,
  SYNC_MAX_DATA_URL_CHARS,
  SYNC_MAX_FILE_BYTES,
} from './sync.constants';
import { SyncService } from './sync.service';

class SyncFileUploadDto {
  @IsString()
  @MaxLength(128)
  localId!: string;

  @IsString()
  @MaxLength(128)
  mimeType!: string;

  @IsString()
  @MaxLength(255)
  fileName!: string;

  /** data: URL from the device queue — size enforced after decode */
  @IsString()
  @MaxLength(SYNC_MAX_DATA_URL_CHARS)
  dataUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  eventId?: string;
}

class BoundedSyncBatchDto implements SyncBatchDto {
  @IsArray()
  @ArrayMaxSize(SYNC_MAX_BATCH_EVENTS)
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events!: SyncEventDto[];
}

@Controller('sync')
@Roles('driver', 'assistant', 'office', 'admin')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('events/batch')
  async ingestBatch(@CurrentUser() user: AuthUser, @Body() dto: BoundedSyncBatchDto) {
    if (!user?.id) throw new UnauthorizedException();
    const acks = await this.sync.ingestBatch(user, dto.events);
    return { data: { acks } };
  }

  @Get('delta')
  async delta(@CurrentUser() user: AuthUser, @Query() query: SyncDeltaQueryDto) {
    if (!user?.id) throw new UnauthorizedException();
    const data = await this.sync.pullDelta(user.id, query.since);
    return { data };
  }

  @Post('files')
  async uploadFile(@CurrentUser() user: AuthUser, @Body() dto: SyncFileUploadDto) {
    if (!user?.id) throw new UnauthorizedException();
    const buffer = dataUrlToBuffer(dto.dataUrl);
    if (buffer.byteLength > SYNC_MAX_FILE_BYTES) {
      throw new PayloadTooLargeException(
        `File exceeds maximum of ${SYNC_MAX_FILE_BYTES} bytes`,
      );
    }
    const result = await this.sync.storeBlob({
      userId: user.id,
      localId: dto.localId,
      mimeType: dto.mimeType,
      fileName: dto.fileName,
      buffer,
      eventId: dto.eventId,
    });
    return { data: result };
  }

  @Get('health')
  health() {
    return { data: { ok: true, engine: 'saki-sync' } };
  }
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  if (dataUrl.includes('..') || dataUrl.includes('\0')) {
    throw new BadRequestException('Malformed upload');
  }
  const match = /^data:([a-zA-Z0-9!#$&\-^_.+/]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(
    dataUrl,
  );
  if (!match?.[2]) {
    throw new BadRequestException('Invalid data URL');
  }
  try {
    return Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  } catch {
    throw new BadRequestException('Malformed base64 upload');
  }
}
