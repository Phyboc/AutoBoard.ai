import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { readDB } from '../../shared/utils/db.js';

export class OffboardingResources {

  @Resource({
    uri: 'employee-lifecycle://tickets',
    name: 'Ticket Assignments',
    description: 'Tickets assigned to each employee by email',
    mimeType: 'application/json'
  })
  async getTickets(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching ticket assignments');

    const tickets = (await readDB('tickets.json')) || [];

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(tickets, null, 2)
      }]
    };
  }
}
