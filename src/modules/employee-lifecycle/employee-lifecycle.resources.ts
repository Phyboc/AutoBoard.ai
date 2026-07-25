import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import * as fs from 'fs';
import * as path from 'path';

export class EmployeeLifecycleResources {

  private getResourcePath(filename: string): string {
    return path.resolve(process.cwd(), 'src/resources', filename);
  }

  @Resource({
    uri: 'employee-lifecycle://employees',
    name: 'Employee Records',
    description: 'List of all employees in the system',
    mimeType: 'application/json'
  })
  async getEmployees(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching employee records');

    // TODO: Replace with database/real data source
    const filePath = this.getResourcePath('employees.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const employees = JSON.parse(raw);

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(employees, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'employee-lifecycle://roles',
    name: 'Role Definitions',
    description: 'Role requirements including software, training, and channels',
    mimeType: 'application/json'
  })
  async getRoles(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching role definitions');

    // TODO: Replace with database/real data source
    const filePath = this.getResourcePath('roles.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const roles = JSON.parse(raw);

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(roles, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'employee-lifecycle://tickets',
    name: 'Ticket Assignments',
    description: 'Tickets assigned to each employee by email',
    mimeType: 'application/json'
  })
  async getTickets(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching ticket assignments');

    // TODO: Replace with database/real data source
    const filePath = this.getResourcePath('tickets.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const tickets = JSON.parse(raw);

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(tickets, null, 2)
      }]
    };
  }
}
