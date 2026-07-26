'use client';

import { useTheme, useWidgetState, useWidgetSDK } from '@nitrostack/widgets';

// Define the normalized state interface for all onboarding actions
interface OnboardingWidgetPayload {
  actionType: 'CREATE_EMPLOYEE' | 'ASSIGN_TRAINING' | 'PROVISION_ACCOUNT' | 'GENERIC_PROGRESS';
  employeeName: string;
  email?: string;
  employeeId?: string;
  role?: string;
  items: { label: string; sublabel?: string; done: boolean }[];
  status: 'Pending' | 'In Progress' | 'Completed';
  message?: string;
}

export default function OnboardingWidget() {
  const theme = useTheme();
  const { getToolOutput } = useWidgetSDK();
  const [state, setState] = useWidgetState<{ expanded: boolean }>(() => ({
    expanded: true
  }));

  const rawData = getToolOutput<any>();

  // Normalizer: Handles tool returns from createEmployee, assignTraining, provisionAccount, etc.
  const normalizeData = (input: any): OnboardingWidgetPayload | null => {
    if (!input) return null;

    const data = input.data || input;
    const msg = input.message || '';
    const success = input.success !== false;

    // 1. Detect `createEmployee` tool output
    if (data.role || data.department || (data.id && data.name && !data.modules && !data.provisioned)) {
      return {
        actionType: 'CREATE_EMPLOYEE',
        employeeName: data.name || data.employeeName || 'New Employee',
        email: data.email,
        employeeId: data.id || data.employeeId,
        role: data.role || data.title,
        items: [
          { label: 'Employee Profile Created', sublabel: `ID: ${data.id || 'Generated'}`, done: true },
          { label: 'Email Assigned', sublabel: data.email || 'Pending', done: !!data.email },
          { label: 'Role Defined', sublabel: data.role || 'Unassigned', done: !!data.role }
        ],
        status: success ? 'Completed' : 'In Progress',
        message: msg
      };
    }

    // 2. Detect `assignTraining` tool output
    if (data.modules || data.trainingList || (input.action === 'ASSIGN_TRAINING')) {
      const modules: string[] = data.modules || data.trainingList || [];
      return {
        actionType: 'ASSIGN_TRAINING',
        employeeName: data.name || data.email || 'Employee',
        email: data.email,
        employeeId: data.employeeId,
        items: modules.length > 0 
          ? modules.map((mod) => ({ label: `Module: ${mod}`, done: true }))
          : [{ label: 'No training modules assigned yet', done: false }],
        status: success ? 'Completed' : 'Pending',
        message: msg
      };
    }

    // 3. Detect `provisionAccount` tool output
    if (data.provisioned || (input.action === 'PROVISION_ACCOUNT')) {
      const provisioned: string[] = data.provisioned || [];
      return {
        actionType: 'PROVISION_ACCOUNT',
        employeeName: data.name || data.email || 'Employee',
        email: data.email,
        employeeId: data.employeeId,
        items: provisioned.length > 0
          ? provisioned.map((sys) => ({ label: `Access Granted: ${sys}`, done: true }))
          : [{ label: 'Account Provisioning', done: success }],
        status: success ? 'Completed' : 'In Progress',
        message: msg
      };
    }

    // 4. Default / Explicit Checklist structure
    if (data.employeeName && Array.isArray(data.progress)) {
      return {
        actionType: 'GENERIC_PROGRESS',
        employeeName: data.employeeName,
        items: data.progress.map((p: any) => ({ label: p.label, done: !!p.done })),
        status: data.status || 'In Progress',
        message: msg
      };
    }

    return null;
  };

  const payload = normalizeData(rawData);
  const isDark = theme === 'dark';

  if (!payload) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        borderRadius: '12px',
        border: `1px dashed ${isDark ? '#374151' : '#e5e7eb'}`,
        color: isDark ? '#9ca3af' : '#4b5563',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <p style={{ margin: 0, fontSize: '13px' }}>Waiting for onboarding operation output...</p>
      </div>
    );
  }

  const actionTitles: Record<string, { title: string; icon: string }> = {
    CREATE_EMPLOYEE: { title: 'Employee Created', icon: '👤' },
    ASSIGN_TRAINING: { title: 'Training Assigned', icon: '📚' },
    PROVISION_ACCOUNT: { title: 'Accounts Provisioned', icon: '⚙️' },
    GENERIC_PROGRESS: { title: 'Onboarding Progress', icon: '🚀' }
  };

  const currentMeta = actionTitles[payload.actionType] || actionTitles.GENERIC_PROGRESS;
  const completedCount = payload.items.filter((i) => i.done).length;

  return (
    <div style={{
      padding: '20px',
      background: isDark
        ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      borderRadius: '16px',
      color: 'white',
      maxWidth: '400px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>{currentMeta.icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{currentMeta.title}</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', opacity: 0.8 }}>{payload.employeeName}</p>
          </div>
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          background: payload.status === 'Completed' ? '#10b981' : '#f59e0b',
          color: '#fff'
        }}>
          {payload.status}
        </span>
      </div>

      {/* Profile Details Header for createEmployee */}
      {payload.actionType === 'CREATE_EMPLOYEE' && (payload.role || payload.email) && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '14px',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {payload.role && <div><strong>Role:</strong> {payload.role}</div>}
          {payload.email && <div><strong>Email:</strong> {payload.email}</div>}
          {payload.employeeId && <div><strong>ID:</strong> {payload.employeeId}</div>}
        </div>
      )}

      {/* Task Checklist Box */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
          <span>Summary</span>
          <strong>{completedCount}/{payload.items.length}</strong>
        </div>

        {state?.expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {payload.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: item.done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.done ? '✅' : '⭕'}</span>
                  <span>{item.label}</span>
                </div>
                {item.sublabel && <span style={{ opacity: 0.7, fontSize: '10px' }}>{item.sublabel}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapse / Expand Toggle */}
      <button
        onClick={() => setState({ expanded: !state?.expanded })}
        style={{
          width: '100%',
          padding: '6px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        {state?.expanded ? '▲ Hide Details' : '▼ View Details'}
      </button>
    </div>
  );
}