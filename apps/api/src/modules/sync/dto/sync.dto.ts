import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { SYNC_MAX_BATCH_EVENTS } from '../sync.constants';

export class SyncEventDto {
  @IsString()
  @MaxLength(128)
  eventId!: string;

  @IsString()
  @MaxLength(64)
  entityType!: string;

  @IsString()
  @MaxLength(128)
  entityId!: string;

  @IsString()
  @MaxLength(64)
  eventType!: string;

  @IsString()
  @MaxLength(128)
  deviceId!: string;

  /** Client value is ignored server-side — JWT AuthUser.id is authoritative (C-01). */
  @IsString()
  @MaxLength(128)
  userId!: string;

  @IsString()
  @MaxLength(64)
  timestamp!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsInt()
  @Min(1)
  version!: number;
}

export class SyncBatchDto {
  @IsArray()
  @ArrayMaxSize(SYNC_MAX_BATCH_EVENTS)
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events!: SyncEventDto[];
}

export class SyncDeltaQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  since?: string;
}
