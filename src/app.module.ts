import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { OffboardingModule } from './modules/offboarding/offboarding.module.js';
import { SystemModule } from './modules/system/system.module.js';

/**
 * Root Application Module
 * 
 * This is the main module that bootstraps the MCP server.
 * It registers all feature modules and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'employee-lifecycle-server',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})
@Module({
  name: 'app',
  description: 'Root application module',
  imports: [
    ConfigModule.forRoot(),
    OnboardingModule,
    OffboardingModule,
    SystemModule
  ],
  providers: []
})
export class AppModule {}
