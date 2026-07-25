import { Module } from '@nitrostack/core';
import { OffboardingTools } from './offboarding.tools.js';
import { OffboardingResources } from './offboarding.resources.js';
import { OffboardingPrompts } from './offboarding.prompts.js';

@Module({
  name: 'offboarding',
  description: 'Employee offboarding lifecycle management - access review, account revocation, ticket reassignment, and deactivation',
  controllers: [OffboardingTools, OffboardingResources, OffboardingPrompts]
})
export class OffboardingModule {}
