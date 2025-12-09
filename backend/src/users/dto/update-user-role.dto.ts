import { IsBoolean } from 'class-validator';

export class UpdateUserRoleDto {
  @IsBoolean()
  isAdmin!: boolean;
}
