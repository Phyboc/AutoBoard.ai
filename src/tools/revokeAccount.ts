/*
import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../utils/db';

export class RevokeAccountTool {
	async execute(input: { platform: string; email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Revoking account', { platform: input.platform, email: input.email });

    // TODO: Implement real account revocation via platform APIs
    return {
      success: true,
      message: `TODO: Implement revoking ${input.platform} account for ${input.email}`,
      data: {
        platform: input.platform,
        email: input.email,
        status: 'Revoked'
      }
    };
  }
}
*/

import { ExecutionContext } from '@nitrostack/core';

// 1. Hackathon Mock Identity Database
// This simulates an identity provider (like Okta or Microsoft Entra).
// We are hardcoding Sarah here so your agent has someone to offboard during the demo.
export const mockUserDatabase = [
  { 
    email: "sarah@company.com", 
    status: "active", 
    accounts: ["Slack", "Google Workspace", "Jira", "GitHub"] 
  },
  { 
    email: "alex@company.com", 
    status: "active", 
    accounts: ["Slack", "Google Workspace"] 
  }
];

export class RevokeAccountTool {
  async execute(input: { platform: string; email: string }, ctx: ExecutionContext) {
    ctx.logger.info('Revoking account', { platform: input.platform, email: input.email });

    // 2. Find the user in our mock database
    const user = mockUserDatabase.find(u => u.email === input.email);

    if (!user) {
      const errorMsg = `User ${input.email} not found in the employee directory.`;
      ctx.logger.warn(errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: null
      };
    }

    // 3. Check if they have the account, and if so, remove it (revoke it)
    const accountIndex = user.accounts.findIndex(
      (acc) => acc.toLowerCase() === input.platform.toLowerCase()
    );
    
    let wasRevoked = false;

    if (accountIndex > -1) {
      // Remove the platform from their active accounts array
      user.accounts.splice(accountIndex, 1); 
      wasRevoked = true;
    }

    // 4. Formulate the response for the Agent's "brain"
    const message = wasRevoked
      ? `Successfully revoked ${input.platform} access for ${input.email}.`
      : `No action taken. ${input.email} did not have active access to ${input.platform}.`;

    ctx.logger.info(message);

    // 5. Return the payload to the agent and to your React Widget
    return {
      success: true,
      message: message,
      data: {
        platform: input.platform,
        email: input.email,
        status: wasRevoked ? 'Revoked' : 'Not Provisioned',
        // Returning the remaining accounts is perfect for the Widget to update the UI
        remainingAccounts: user.accounts,
        fullUserState: user 
      }
    };
  }
}