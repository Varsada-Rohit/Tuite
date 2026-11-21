import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';

/** TEMPORARY — remove after seeding the Super Admin. */
@Module({ controllers: [SeedController] })
export class SeedModule {}
