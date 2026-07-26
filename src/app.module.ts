import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { OffboardingModule } from './modules/offboarding/offboarding.module.js';
import { SystemModule } from './modules/system/system.module.js';
import { AuditResourceProvider } from './resources/auditResource.js';
import { EmployeeLifecycleInstructions } from './modules/employee-lifecycle/employee-lifecycle.instruct.js';

/**
 * Root Application Module
 * 
 * This is the main module that bootstraps the MCP server.
 * It registers all feature modules, resource providers, and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'AutoBoard.ai',
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
  providers: [
    AuditResourceProvider,
    EmployeeLifecycleInstructions
  ]
})
export class AppModule {}
