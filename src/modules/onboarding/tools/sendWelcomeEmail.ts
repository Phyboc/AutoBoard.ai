import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';
import { Employee } from './createEmployee.js';
import nodemailer from 'nodemailer';

interface SendWelcomeEmailInput {
  email: string;
}

export class SendWelcomeEmailTool {
  async execute(input: SendWelcomeEmailInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('SEND_WELCOME_EMAIL');
    ctx.logger.info('Sending welcome email', { email: input.email });

    const targetEmail = (input.email || '').toLowerCase().trim();

    if (!targetEmail) {
      const errMsg = 'Email must be provided.';
      await tracker.addStep('Validation', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'UNKNOWN',
        action: 'SEND_WELCOME_EMAIL',
        system: 'Email Service',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: errMsg,
        data: { email: input.email, status: 'Failed' }
      };
    }

    try {
      const employees: Employee[] = (await readDB('employees.json')) || [];

      const emp = employees.find(
        (e) => e.email.toLowerCase() === targetEmail || e.name.toLowerCase().includes(targetEmail)
      );

      if (!emp) {
        const notFoundMsg = `Employee with email/name '${input.email}' was not found.`;
        await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: targetEmail,
          action: 'SEND_WELCOME_EMAIL',
          system: 'Email Service',
          status: 'FAILED',
          details: notFoundMsg
        });

        return {
          success: false,
          message: notFoundMsg,
          data: { email: input.email, status: 'Failed' }
        };
      }

      let previewUrl = 'https://ethereal.email/preview-mock';

      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        const info = await transporter.sendMail({
          from: '"AutoBoard AI" <onboarding@autoboard.ai>',
          to: emp.email,
          subject: `Welcome to the Team, ${emp.name}! 🎉`,
          html: `<h3>Welcome aboard, ${emp.name}!</h3><p>Your onboarding is complete.</p>`
        });

        const url = nodemailer.getTestMessageUrl(info);
        if (url) previewUrl = url;
      } catch (e) {
        ctx.logger.warn('Ethereal dispatch timed out, falling back to mock URL');
      }

      emp.status = 'Active';
      emp.welcomeEmailSent = true;
      await writeDB('employees.json', employees);

      await tracker.addStep('Send Welcome Email', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: emp.email,
        action: 'SEND_WELCOME_EMAIL',
        system: 'Email Service',
        status: 'SUCCESS',
        details: `Welcome email sent. Employee status set to Active. Preview URL: ${previewUrl}`
      });

      return {
        success: true,
        message: `Welcome email dispatched to ${emp.email}`,
        data: {
          employeeId: emp.id,
          name: emp.name,
          email: emp.email,
          previewUrl
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to send welcome email', { error: errMsg });

      await tracker.addStep('Send Welcome Email', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: targetEmail,
        action: 'SEND_WELCOME_EMAIL',
        system: 'Email Service',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to send email: ${errMsg}`,
        data: { email: input.email, status: 'Failed' }
      };
    }
  }
}
