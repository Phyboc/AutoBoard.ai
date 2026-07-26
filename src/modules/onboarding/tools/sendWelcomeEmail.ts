// import { ExecutionContext } from '@nitrostack/core';
// import { readDB, writeDB } from '../../../utils/db.js';
// import { logAudit } from '../../../utils/auditLogger.js';
// import { ExecutionTracker } from '../../../utils/executionTracker.js';
// import { Employee } from './createEmployee.js';
// // import nodemailer from 'nodemailer';
// import { Resend } from 'resend';
// interface SendWelcomeEmailInput {
//   email: string;
// }

// export class SendWelcomeEmailTool {
//   async execute(input: SendWelcomeEmailInput, ctx: ExecutionContext) {
//     const tracker = new ExecutionTracker('SEND_WELCOME_EMAIL');
//     ctx.logger.info('Sending welcome email', { email: input.email });

//     const targetEmail = (input.email || '').toLowerCase().trim();

//     if (!targetEmail) {
//       const errMsg = 'Email must be provided.';
//       await tracker.addStep('Validation', 'FAILED', errMsg);
//       await tracker.finishWorkflow();

//       await logAudit({
//         employee: 'UNKNOWN',
//         action: 'SEND_WELCOME_EMAIL',
//         system: 'Email Service',
//         status: 'FAILED',
//         details: errMsg
//       });

//       return {
//         success: false,
//         message: errMsg,
//         data: { email: input.email, status: 'Failed' }
//       };
//     }

//     try {
//       const employees: Employee[] = (await readDB('employees.json')) || [];

//       const emp = employees.find(
//         (e) => e.email.toLowerCase() === targetEmail || e.name.toLowerCase().includes(targetEmail)
//       );

//       if (!emp) {
//         const notFoundMsg = `Employee with email/name '${input.email}' was not found.`;
//         await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
//         await tracker.finishWorkflow();

//         await logAudit({
//           employee: targetEmail,
//           action: 'SEND_WELCOME_EMAIL',
//           system: 'Email Service',
//           status: 'FAILED',
//           details: notFoundMsg
//         });

//         return {
//           success: false,
//           message: notFoundMsg,
//           data: { email: input.email, status: 'Failed' }
//         };
//       }

//       // let previewUrl = 'https://ethereal.email/preview-mock';

//       // try {
//       //   const testAccount = await nodemailer.createTestAccount();
//       //   const transporter = nodemailer.createTransport({
//       //     host: 'smtp.ethereal.email',
//       //     port: 587,
//       //     secure: false,
//       //     auth: {
//       //       user: testAccount.user,
//       //       pass: testAccount.pass
//       //     }
//       //   });

//       //   const info = await transporter.sendMail({
//       //     from: '"AutoBoard AI" <onboarding@autoboard.ai>',
//       //     to: emp.email,
//       //     subject: `Welcome to the Team, ${emp.name}! 🎉`,
//       //     html: `<h3>Welcome aboard, ${emp.name}!</h3><p>Your onboarding is complete.</p>`
//       //   });

//       //   const url = nodemailer.getTestMessageUrl(info);
//       //   if (url) previewUrl = url;
//       // } catch (e) {
//       //   ctx.logger.warn('Ethereal dispatch timed out, falling back to mock URL');
//       // }

//       const resend = new Resend(process.env.RESEND_API_KEY);

//       const recipient = process.env.DEMO_EMAIL || emp.email;

//       let emailId = '';

//       try {
//         const response = await resend.emails.send({
//           from: 'onboarding@resend.dev',
//           to: recipient,
//           subject: `Welcome to AutoBoard.ai, ${emp.name}! 🎉`,
//           html: `
//             <div style="font-family:Arial,sans-serif;padding:20px;">
//               <h2>Welcome to AutoBoard.ai 🎉</h2>

//               <p>Hello <strong>${emp.name}</strong>,</p>

//               <p>Your onboarding process has been completed successfully.</p>

//               <h3>Employee Details</h3>

//               <table style="border-collapse:collapse;">
//                 <tr>
//                   <td><strong>Name</strong></td>
//                   <td style="padding-left:15px;">${emp.name}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Role</strong></td>
//                   <td style="padding-left:15px;">${emp.role}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Start Date</strong></td>
//                   <td style="padding-left:15px;">${emp.startDate}</td>
//                 </tr>
//               </table>

//               <br>

//               <p>Your accounts have been provisioned and your training modules have been assigned.</p>

//               <p>We're excited to have you on board!</p>

//               <br>

//               <p><strong>— AutoBoard.ai HR Team</strong></p>
//             </div>
//           `
//         });

//         emailId = response.data?.id ?? '';

//         ctx.logger.info('Welcome email sent successfully', {
//           employee: emp.email,
//           deliveredTo: recipient,
//           emailId
//         });

//       } catch (error) {
//         ctx.logger.warn('Failed to send Resend email', {
//           error: (error as Error).message
//         });

//         throw error;
//       }

//       emp.status = 'Active';
//       emp.welcomeEmailSent = true;
//       await writeDB('employees.json', employees);

//       await tracker.addStep('Send Welcome Email', 'SUCCESS');
//       await tracker.finishWorkflow();

//       await logAudit({
//         employee: emp.email,
//         action: 'SEND_WELCOME_EMAIL',
//         system: 'Email Service',
//         status: 'SUCCESS',
//         details: `Welcome email sent. Employee status set to Active. Preview URL: ${previewUrl}`
//       });

//       return {
//         success: true,
//         message: `Welcome email dispatched to ${emp.email}`,
//         data: {
//           employeeId: emp.id,
//           name: emp.name,
//           email: emp.email,
//           previewUrl
//         }
//       };
//     } catch (error) {
//       const errMsg = (error as Error).message;
//       ctx.logger.error('Failed to send welcome email', { error: errMsg });

//       await tracker.addStep('Send Welcome Email', 'FAILED', errMsg);
//       await tracker.finishWorkflow();

//       await logAudit({
//         employee: targetEmail,
//         action: 'SEND_WELCOME_EMAIL',
//         system: 'Email Service',
//         status: 'FAILED',
//         details: errMsg
//       });

//       return {
//         success: false,
//         message: `Failed to send email: ${errMsg}`,
//         data: { email: input.email, status: 'Failed' }
//       };
//     }
//   }
// }



import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';
import { Employee } from './createEmployee.js';
import { Resend } from 'resend';

interface SendWelcomeEmailInput {
  email: string;
}

export class SendWelcomeEmailTool {
  async execute(input: SendWelcomeEmailInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('SEND_WELCOME_EMAIL');

    ctx.logger.info('Sending welcome email', {
      email: input.email
    });

    const targetEmail = (input.email || '').toLowerCase().trim();

    if (!targetEmail) {
      const errMsg = 'Email must be provided.';

      await tracker.addStep('Validation', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'UNKNOWN',
        action: 'SEND_WELCOME_EMAIL',
        system: 'Resend',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: errMsg,
        data: {
          email: input.email,
          status: 'Failed'
        }
      };
    }

    try {
      const employees: Employee[] = (await readDB('employees.json')) || [];

      const emp = employees.find(
        (e) =>
          e.email.toLowerCase() === targetEmail ||
          e.name.toLowerCase().includes(targetEmail)
      );

      if (!emp) {
        const notFoundMsg = `Employee with email/name '${input.email}' was not found.`;

        await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: targetEmail,
          action: 'SEND_WELCOME_EMAIL',
          system: 'Resend',
          status: 'FAILED',
          details: notFoundMsg
        });

        return {
          success: false,
          message: notFoundMsg,
          data: {
            email: input.email,
            status: 'Failed'
          }
        };
      }

      const apiKey = process.env.RESEND_API_KEY;

      if (!apiKey) {
        throw new Error('RESEND_API_KEY is missing in .env');
      }

      const resend = new Resend(apiKey);

      // Demo inbox because Resend free plan only allows verified recipients
      const recipient = process.env.DEMO_EMAIL || emp.email;

      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: recipient,
        subject: `Welcome to AutoBoard.ai, ${emp.name}! 🎉`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;border:1px solid #ddd;border-radius:10px;">
          <h1 style="color:#2563eb;">🎉 Welcome to AutoBoard.ai</h1>

          <p>Hello <strong>${emp.name}</strong>,</p>

          <p>
            Congratulations! Your onboarding process has been completed successfully.
          </p>

          <hr>

          <h3>Employee Details</h3>

          <table style="border-collapse:collapse;">
            <tr>
              <td style="padding:6px;"><strong>Name</strong></td>
              <td style="padding:6px;">${emp.name}</td>
            </tr>

            <tr>
              <td style="padding:6px;"><strong>Email</strong></td>
              <td style="padding:6px;">${emp.email}</td>
            </tr>

            <tr>
              <td style="padding:6px;"><strong>Role</strong></td>
              <td style="padding:6px;">${emp.role}</td>
            </tr>

            <tr>
              <td style="padding:6px;"><strong>Start Date</strong></td>
              <td style="padding:6px;">${emp.startDate}</td>
            </tr>
          </table>

          <br>

          <h3>Your onboarding includes</h3>

          <ul>
            <li>✅ Employee profile created</li>
            <li>✅ Accounts provisioned</li>
            <li>✅ Training assigned</li>
            <li>✅ Welcome email sent</li>
          </ul>

          <p>
            We are excited to have you join the team.
          </p>

          <br>

          <p>
            Regards,<br>
            <strong>AutoBoard.ai HR Team</strong>
          </p>
        </div>
        `
      });

      emp.status = 'Active';
      emp.welcomeEmailSent = true;

      await writeDB('employees.json', employees);

      await tracker.addStep('Send Welcome Email', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: emp.email,
        action: 'SEND_WELCOME_EMAIL',
        system: 'Resend',
        status: 'SUCCESS',
        details: `Email delivered to demo inbox (${recipient}). Employee status updated to Active. Message ID: ${response.data?.id ?? 'N/A'}`
      });

      ctx.logger.info('Welcome email sent', {
        employee: emp.email,
        deliveredTo: recipient
      });

      return {
        success: true,
        message: `Welcome email sent successfully for ${emp.name}`,
        data: {
          employeeId: emp.id,
          name: emp.name,
          employeeEmail: emp.email,
          deliveredTo: recipient,
          provider: 'Resend',
          messageId: response.data?.id ?? null
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;

      ctx.logger.error('Failed to send welcome email', {
        error: errMsg
      });

      await tracker.addStep('Send Welcome Email', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: targetEmail,
        action: 'SEND_WELCOME_EMAIL',
        system: 'Resend',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to send welcome email: ${errMsg}`,
        data: {
          email: input.email,
          status: 'Failed'
        }
      };
    }
  }
}