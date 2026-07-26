import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { writeDB, readDB } from '../../utils/db.js';

/**
 * AddTaskTool
 *
 * Assigns a task to an employee. Tasks are persisted in the employee's
 * record within employees.json under a `tasks` array.
 * Each task has a description, status, and timestamp.
 */
export class AddTaskTool {

  @Tool({
    name: 'addTask',
    description: `Assign a new task to an employee. Use this to track action items,
to-dos, or follow-ups during onboarding or offboarding workflows.`,
    inputSchema: z.object({
      employeeEmail: z.string().describe('The company email of the employee to assign the task to'),
      description: z.string().describe('A clear description of the task to be completed'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority level (default: medium)')
    })
  })
  @Widget('/onboarding')
  async execute(input: {
    employeeEmail: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
  }, ctx: ExecutionContext) {
    const { employeeEmail, description } = input;
    const priority = input.priority || 'medium';

    ctx.logger.info(`[addTask] Adding task for "${employeeEmail}": "${description}"`);

    if (!employeeEmail || !employeeEmail.includes('@')) {
      return {
        success: false,
        message: 'A valid employee email with "@" is required.',
        data: null
      };
    }

    if (!description || !description.trim()) {
      return {
        success: false,
        message: 'Task description cannot be empty.',
        data: null
      };
    }

    try {
      const employees = await readDB('employees.json');
      const empIdx = employees.findIndex((e: any) =>
        e.email?.toLowerCase() === employeeEmail.toLowerCase() ||
        e.name?.toLowerCase().includes(employeeEmail.toLowerCase())
      );

      if (empIdx < 0) {
        return {
          success: false,
          message: `Employee with email "${employeeEmail}" not found.`,
          data: null
        };
      }

      const employee = employees[empIdx];
      if (!employee.tasks) {
        employee.tasks = [];
      }

      const newTask = {
        id: `task-${Date.now().toString().slice(-6)}`,
        description: description.trim(),
        priority,
        status: 'pending' as const,
        assignedAt: new Date().toISOString(),
        assignedBy: ctx.metadata?.callerName || 'System'
      };

      employee.tasks.push(newTask);
      await writeDB('employees.json', employees);

      ctx.logger.info(`[addTask] Task added successfully: ${newTask.id} for ${employee.name}`);

      const priorityLabel = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' }[priority];

      return {
        success: true,
        message: `✅ Task assigned to **${employee.name}**: "${description}" (${priorityLabel})`,
        data: {
          employeeName: employee.name,
          employeeEmail: employee.email,
          task: newTask,
          totalTasks: employee.tasks.length
        }
      };
    } catch (err) {
      ctx.logger.error(`[addTask] Failed to add task: ${err}`);
      return {
        success: false,
        message: `Failed to add task: ${(err as Error).message}`,
        data: null
      };
    }
  }
}
