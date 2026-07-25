import { Module } from '@nitrostack/core';
import { EmployeeLifecycleTools } from './employee-lifecycle.tools.js';
import { EmployeeLifecycleResources } from './employee-lifecycle.resources.js';
import { EmployeeLifecyclePrompts } from './employee-lifecycle.prompts.js';

@Module({
  name: 'employee-lifecycle',
  description: 'Employee onboarding and offboarding lifecycle management',
  controllers: [EmployeeLifecycleTools, EmployeeLifecycleResources, EmployeeLifecyclePrompts]
})
export class EmployeeLifecycleModule {}
