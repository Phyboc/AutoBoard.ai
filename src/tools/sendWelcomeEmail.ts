import { ExecutionContext } from '@nitrostack/core';

export class SendWelcomeEmailTool {
  async execute(input: { email: string }, ctx: ExecutionContext) {
    ctx.logger.info('Sending welcome email', { email: input.email });

    // TODO: Implement real email sending via email service
    return {
      success: true,
      message: `TODO: Implement sending welcome email to ${input.email}`,
      data: {
        email: input.email,
        status: 'Sent'
      }
    };
  }
}
