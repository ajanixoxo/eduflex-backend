import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RoomContextDto {
  @ApiProperty({
    example: 'course-507f1f77bcf86cd799439011-module-1-lesson-1.1',
    description:
      'LiveKit room name in format: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}',
  })
  @IsString()
  @IsNotEmpty()
  room_name: string;
}
