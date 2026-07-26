'use client';

import { useTheme, useWidgetState, useWidgetSDK } from '@nitrostack/widgets';

/**
 * OffboardingWidget - displays employee offboarding progress
 * This widget is compatible with OpenAI ChatGPT via NitroStack Widget SDK
 * Supports both full offboarding data and draft/partial states from initiateOffboarding / updateOffboardingDraft
 */

interface OffboardingData {
  employeeName: string;
  revokedSystems: {
    name: string;
    revoked: boolean;
  }[];
  ticketReassignment: {
    count: number | string;
    assignedTo: string;
    done: boolean;
  };
  status: 'Pending' | 'In Progress' | 'Ready' | 'Completed';
}

export const dynamic = 'force-dynamic';

export default function OffboardingWidget() {
  const theme = useTheme();
  const { isReady, getToolOutput } = useWidgetSDK();
  const [state, setState] = useWidgetState<{ expanded: boolean }>(() => ({
    expanded: true
  }));

  const isDark = theme === 'dark';

  if (!isReady) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: isDark ? '#9ca3af' : '#4b5563',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <p style={{ margin: 0, fontSize: '13px' }}>Connecting to host...</p>
      </div>
    );
  }

  const rawData = getToolOutput<any>();
  const data = (rawData?.data || rawData) as OffboardingData;

  // Handle draft/partial state gracefully — show a minimal card even when data is sparse
  if (!data || !data.revokedSystems) {
    return (
      <div style={{
        padding: '24px',
        background: isDark
          ? 'linear-gradient(135deg, #1c1917 0%, #7f1d1d 100%)'
          : 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
        borderRadius: '16px',
        color: 'white',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '32px' }}>🚪</span>
        <h3 style={{ margin: '12px 0 4px', fontSize: '18px', fontWeight: 600 }}>
          Offboarding
        </h3>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>
          {data?.employeeName ? `Preparing offboarding for ${data.employeeName}...` : 'No offboarding data available yet.'}
        </p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Pending: '#f59e0b',
    'In Progress': '#3b82f6',
    Ready: '#8b5cf6',
    Completed: '#10b981'
  };

  // Defensive: ensure ticketReassignment has a valid structure even in draft mode
  const ticket = data.ticketReassignment || { count: 'TBD', assignedTo: 'TBD', done: false };
  const revokedCount = (data.revokedSystems || []).filter((s: any) => s.revoked).length;
  const totalSystems = (data.revokedSystems || []).length;

  return (
    <div style={{
      padding: '24px',
      background: isDark
        ? 'linear-gradient(135deg, #1c1917 0%, #7f1d1d 100%)'
        : 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
      borderRadius: '16px',
      color: 'white',
      maxWidth: '400px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🚪</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
              Offboarding
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
              {data.employeeName}
            </p>
          </div>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          background: statusColors[data.status] || '#6b7280',
          color: '#fff'
        }}>
          {data.status}
        </div>
      </div>

      {/* Revoked Systems */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '14px', opacity: 0.9, fontWeight: 'bold' }}>
            🔒 Revoked Systems
          </span>
          <span style={{ fontSize: '13px' }}>
            {revokedCount}/{totalSystems}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.revokedSystems.map((system, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: system.revoked
                  ? 'rgba(239,68,68,0.2)'
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {system.revoked ? '❌' : '🔑'}
              </span>
              <span style={{
                textDecoration: system.revoked ? 'line-through' : 'none',
                opacity: system.revoked ? 0.7 : 1
              }}>
                {system.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Reassignment */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🎫</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              Ticket Reassignment
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              {ticket.count} tickets → {ticket.assignedTo}
            </div>
          </div>
        </div>
        {ticket.done ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#10b981'
          }}>
            <span>✅</span> Complete
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            opacity: 0.7
          }}>
            <span>⏳</span> Pending
          </div>
        )}
      </div>

      {/* Toggle expand/collapse */}
      <button
        onClick={() => setState({ expanded: !state?.expanded })}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.2s',
        }}
      >
        {state?.expanded ? '▲ Collapse' : '▼ Expand'}
      </button>

      <div style={{
        marginTop: '12px',
        fontSize: '10px',
        textAlign: 'center',
        opacity: 0.5
      }}>
        AutoBoard.ai Agent
      </div>
    </div>
  );
}
