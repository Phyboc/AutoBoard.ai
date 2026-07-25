import { Module } from '@nitrostack/core';
import { OnboardingTools } from './onboarding.tools.js';
import { OnboardingResources } from './onboarding.resources.js';
import { OnboardingPrompts } from './onboarding.prompts.js';

@Module({
  name: 'onboarding',
  description: 'Employee onboarding lifecycle management - role requirements, account provisioning, training, and welcome communications',
  controllers: [OnboardingTools, OnboardingResources, OnboardingPrompts]
})
export class OnboardingModule {}
