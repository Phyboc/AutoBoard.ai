// src/utils/executionTracker.ts

import { readDB, writeDB } from './db.js';

export interface ExecutionStep {
  name: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  error?: string;
  timestamp: string;
}

export interface ExecutionRecord {
  id: string;
  type: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED';
  steps: ExecutionStep[];
  startTime: string;
  endTime?: string;
}

export class ExecutionTracker {
  private record: ExecutionRecord;

  constructor(type: string, id?: string) {
    this.record = {
      id: id || `exec-${Date.now().toString().slice(-6)}`,
      type,
      status: 'IN_PROGRESS',
      steps: [],
      startTime: new Date().toISOString()
    };
  }

  async addStep(name: string, status: ExecutionStep['status'], error?: string) {
    this.record.steps.push({
      name,
      status,
      error,
      timestamp: new Date().toISOString()
    });
    await this.save();
  }

  async finishWorkflow() {
    const hasFailures = this.record.steps.some(s => s.status === 'FAILED');
    const hasSuccesses = this.record.steps.some(s => s.status === 'SUCCESS');

    if (hasFailures && hasSuccesses) {
      this.record.status = 'PARTIALLY_COMPLETED';
    } else if (hasFailures) {
      this.record.status = 'FAILED';
    } else {
      this.record.status = 'COMPLETED';
    }

    this.record.endTime = new Date().toISOString();
    await this.save();
    return this.getSummary();
  }

  getSummary() {
    const successful = this.record.steps.filter(s => s.status === 'SUCCESS').map(s => s.name);
    const failed = this.record.steps.filter(s => s.status === 'FAILED').map(s => s.name);

    return {
      id: this.record.id,
      workflowStatus: this.record.status,
      completed: successful,
      failed: failed,
      nextAction: failed.length > 0 ? `Retry: ${failed.join(', ')}` : 'None'
    };
  }

  private async save() {
    const executions = (await readDB('execution.json')) || [];
    const index = executions.findIndex((e: any) => e.id === this.record.id);
    
    if (index > -1) {
      executions[index] = this.record;
    } else {
      executions.push(this.record);
    }
    
    await writeDB('execution.json', executions);
  }
}