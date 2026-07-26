import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { readDB } from '../utils/db.js';

export class AuditResourceProvider {
  @Resource({
    uri: 'employee-lifecycle://audit',
    name: 'Audit Log',
    description: 'Security and employee lifecycle audit event logs stored in audit.json',
    mimeType: 'application/json',
  })
  async getAuditLog(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching audit log records');
    const logs = (await readDB('audit.json')) || [];
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(logs, null, 2),
        },
      ],
    };
  }

  @Resource({
    uri: 'employee-lifecycle://execution',
    name: 'Execution Log',
    description: 'Workflow execution tracking records stored in execution.json',
    mimeType: 'application/json',
  })
  async getExecutionLog(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching execution log records');
    const executions = (await readDB('execution.json')) || [];
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(executions, null, 2),
        },
      ],
    };
  }
}