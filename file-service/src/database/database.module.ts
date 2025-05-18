import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../modules/files/entities/file.entity';
import { FolderEntity } from '../modules/folders/entities/folder.entity';
import { FileShareEntity } from '../modules/sharing/entities/file-share.entity';
import { FileVersionEntity } from '../modules/files/entities/file-version.entity';
import { FileTagEntity } from '../modules/files/entities/file-tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FileEntity,
      FolderEntity,
      FileShareEntity,
      FileVersionEntity,
      FileTagEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
