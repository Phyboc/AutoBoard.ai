import { Module } from '@nitrostack/core';
import { SystemHealthCheck } from './system.health.js';

@Module({
  name: 'system',
  description: 'System observability and health monitoring',
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class SystemModule {}
