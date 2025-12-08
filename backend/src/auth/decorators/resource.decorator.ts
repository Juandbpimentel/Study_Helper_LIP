import { SetMetadata } from '@nestjs/common';

export const RESOURCE_KEY = 'resource';
export const Resource = (name: string) => SetMetadata(RESOURCE_KEY, name);
