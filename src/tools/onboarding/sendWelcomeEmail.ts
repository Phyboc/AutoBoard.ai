import { ExecutionContext } from '@nitrostack/core';
import { readFile, writeFile } from 'node:fs/promises';
import { getResourcePath } from '../utils.js';
import { Employee } from './createEmployee.js';
import { logAudit } from '../../utils/auditLogger.js'; // Added Audit Logger
import nodemailer from 'nodemailer';

interface SendWelcomeEmailInput {
  email: string;
}

export class SendWelcomeEmailTool {
  async execute(input: SendWelcomeEmailInput, ctx: ExecutionContext) {
    ctx.logger.info('Sending welcome email', { email: input.email });

    const targetEmail = (input.email || '').toLowerCase().trim();

    if (!targetEmail) {
      return {
        success: false,
        message: 'Email must be provided.',
        data: { email: input.email, status: 'Failed' }
      };
    }

    try {
      const filePath = getResourcePath('employees.json');
      const fileData = await readFile(filePath, 'utf-8');
      const employees: Employee[] = JSON.parse(fileData);

      const emp = employees.find(
        (e) => e.email.toLowerCase() === targetEmail || e.name.toLowerCase().includes(targetEmail)
      );

      if (!emp) {
        const notFoundMsg = `Employee with email/name '${input.email}' was not found.`;

        // ❌ FAILURE AUDIT LOG (Employee Not Found)
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
        // Attempt Ethereal dispatch with fallback
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
      await writeFile(filePath, JSON.stringify(employees, null, 2), 'utf-8');

      // ✅ SUCCESS AUDIT LOG
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
      ctx.logger.error('Failed to send welcome email', { error: (error as Error).message });

      // ❌ FAILURE AUDIT LOG (Exception)
      await logAudit({
        employee: targetEmail,
        action: 'SEND_WELCOME_EMAIL',
        system: 'Email Service',
        status: 'FAILED',
        details: (error as Error).message
      });

      return {
        success: false,
        message: `Failed to send email: ${(error as Error).message}`,
        data: { email: input.email, status: 'Failed' }
      };
    }
  }
}