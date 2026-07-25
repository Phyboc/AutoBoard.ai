'use client';

import { useTheme, useWidgetState, useWidgetSDK } from '@nitrostack/widgets';

/**
 * OnboardingWidget - displays employee onboarding progress
 * This widget is compatible with OpenAI ChatGPT via NitroStack Widget SDK
 */

interface OnboardingData {
  employeeName: string;
  progress: {
    label: string;
    done: boolean;
  }[];
  status: 'Pending' | 'In Progress' | 'Completed';
}

export default function OnboardingWidget() {
  const theme = useTheme();
  const { getToolOutput } = useWidgetSDK();
  const [state, setState] = useWidgetState<{ expanded: boolean }>(() => ({
    expanded: true
  }));

  const data = getToolOutput<OnboardingData>();

  if (!data) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: theme === 'dark' ? '#fff' : '#000',
      }}>
        {/* TODO: Implement real onboarding data from tool output */}
        <p>No onboarding data available yet.</p>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const accentColor = '#6366f1';
  const successColor = '#10b981';

  const statusColors: Record<string, string> = {
    Pending: '#f59e0b',
    'In Progress': '#3b82f6',
    Completed: '#10b981'
  };

  const completedCount = data.progress.filter(p => p.done).length;

  return (
    <div style={{
      padding: '24px',
      background: isDark
        ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
          <span style={{ fontSize: '32px' }}>🚀</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
              Onboarding
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

      {/* Progress Bar */}
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
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', opacity: 0.9 }}>Progress</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {completedCount}/{data.progress.length}
          </span>
        </div>
        <div style={{
          height: '8px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            height: '100%',
            width: `${(completedCount / data.progress.length) * 100}%`,
            background: `linear-gradient(90deg, ${accentColor}, ${successColor})`,
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }} />
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.progress.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: item.done
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {item.done ? '✅' : '⭕'}
              </span>
              <span style={{
                textDecoration: item.done ? 'line-through' : 'none',
                opacity: item.done ? 0.7 : 1
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
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

      {/* TODO: Implement real employee lifecycle integration */}
      <div style={{
        marginTop: '12px',
        fontSize: '10px',
        textAlign: 'center',
        opacity: 0.5
      }}>
        Employee Lifecycle Agent
      </div>
    </div>
  );
}
