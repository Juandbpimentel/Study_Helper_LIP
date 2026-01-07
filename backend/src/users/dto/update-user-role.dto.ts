import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Define se o usuário terá privilégios administrativos',
  })
  @IsBoolean()
  isAdmin!: boolean;
}
