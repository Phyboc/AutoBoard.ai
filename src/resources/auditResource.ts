// import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
// import { readDB } from '../utils/db.js';

// export class AuditResourceProvider {

//   @Resource({
//     uri: 'employee-lifecycle://audit',
//     name: 'Audit Log',
//     description: 'Security and offboarding audit event logs stored in audit.json',
//     mimeType: 'application/json'
//   })
//   async getAuditLog(uri: string, ctx: ExecutionContext) {
//     ctx.logger.info('Fetching audit log records');

//     const logs = await readDB('audit.json');

//     return {
//       contents: [{
//         uri,
//         mimeType: 'application/json',
//         text: JSON.stringify(logs, null, 2)
//       }]
//     };
//   }

//   @Resource({
//     uri: 'employee-lifecycle://execution',
//     name: 'Execution Log',
//     description: 'Workflow execution tracking records stored in execution.json',
//     mimeType: 'application/json'
//   })
//   async getExecutionLog(uri: string, ctx: ExecutionContext) {
//     ctx.logger.info('Fetching execution log records');

//     const executions = await readDB('execution.json');

//     return {
//       contents: [{
//         uri,
//         mimeType: 'application/json',
//         text: JSON.stringify(executions, null, 2)
//       }]
//     };
//   }
// }


// import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
// import { readFile } from 'node:fs/promises';
// import path from 'node:path';

// export class AuditResourceProvider {
//   @Resource({
//     uri: 'employee-lifecycle://audit',
//     name: 'Audit Logs',
//     description: 'System audit logs',
//     mimeType: 'application/json',
//   })
//   async getAuditLog(ctx: ExecutionContext) {
//     const filePath = path.resolve(process.cwd(), 'src', 'resources', 'audit.json');
//     let content = '[]';

//     try {
//       content = await readFile(filePath, 'utf-8');
//     } catch (e) {
//       ctx.logger.error(`Failed to read audit log resource at ${filePath}`);
//     }

//     return {
//       contents: [
//         {
//           uri: 'employee-lifecycle://audit',
//           text: content,
//         },
//       ],
//     };
//   }
// }

import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export class AuditResourceProvider {
  @Resource({
    uri: 'employee-lifecycle://audit',
    name: 'Audit Logs',
    description: 'System audit logs',
    mimeType: 'application/json',
  })
  async getAuditLog(ctx: ExecutionContext) {
    const filePath = path.resolve(process.cwd(), 'src', 'resources', 'audit.json');
    let content = '[]';
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (e) {
      ctx.logger.error(`Failed to read audit log at ${filePath}`);
    }
    return { contents: [{ uri: 'employee-lifecycle://audit', text: content }] };
  }

  @Resource({
    uri: 'employee-lifecycle://execution',
    name: 'Execution Logs',
    description: 'Workflow execution steps',
    mimeType: 'application/json',
  })
  async getExecutionLog(ctx: ExecutionContext) {
    const filePath = path.resolve(process.cwd(), 'src', 'resources', 'execution.json');
    let content = '[]';
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (e) {
      ctx.logger.error(`Failed to read execution log at ${filePath}`);
    }
    return { contents: [{ uri: 'employee-lifecycle://execution', text: content }] };
  }
}