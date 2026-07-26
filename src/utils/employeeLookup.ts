import { readDB } from './db.js';

/**
 * Looks up an employee in employees.json by email or name match.
 * Returns the employee record or null if not found.
 */
export async function findEmployee(identifier: string): Promise<any | null> {
  if (!identifier || identifier === 'TBD') return null;
  try {
    const employees = await readDB('employees.json');
    const emp = employees.find((e: any) =>
      e.email?.toLowerCase() === identifier.toLowerCase() ||
      e.name?.toLowerCase().includes(identifier.toLowerCase())
    );
    return emp || null;
  } catch {
    return null;
  }
}

/**
 * Resolves the list of provisioned accounts for a given employee identifier.
 * Returns the employee's actual provisioned accounts if found,
 * or a sensible default list if the employee is not yet persisted.
 */
export async function resolveProvisionedAccounts(employeeEmail?: string): Promise<string[]> {
  if (!employeeEmail || employeeEmail === 'TBD') {
    return [];
  }
  const emp = await findEmployee(employeeEmail);
  if (emp && Array.isArray(emp.provisionedAccounts) && emp.provisionedAccounts.length > 0) {
    return emp.provisionedAccounts;
  }
  return ['Google Workspace', 'Slack', 'GitHub'];
}
