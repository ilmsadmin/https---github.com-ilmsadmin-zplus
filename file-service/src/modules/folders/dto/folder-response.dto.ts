import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FolderResponseDto {
  @ApiProperty({ description: 'Folder ID' })
  id: string;

  @ApiProperty({ description: 'Folder name' })
  name: string;

  @ApiPropertyOptional({ description: 'Folder description' })
  description: string;

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  parentId: string;

  @ApiPropertyOptional({ description: 'Parent folder name' })
  parentName?: string;

  @ApiProperty({ description: 'Full path of the folder' })
  path: string;

  @ApiProperty({ description: 'Creator user ID' })
  creatorId: string;

  @ApiProperty({ description: 'Owner user ID' })
  ownerId: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
  
  @ApiPropertyOptional({ description: 'Child folders when returning a tree structure' })
  children?: FolderResponseDto[];
}
