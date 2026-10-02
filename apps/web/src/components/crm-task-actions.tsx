'use client';

import { useState } from 'react';

type Task = {
  id: string | null;
  assigned_to: string | null;
  title: string | null;
  description: string | null;
  due_at: string | null;
  priority: string | null;
  status: string | null;
  updated_at: string | null;
};
type Staff = { id: string; name: string };

export function TaskActions({ task, staff }: Readonly<{ task: Task; staff: Staff[] }>) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="crm-inline-action"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage('');
        const data = new FormData(event.currentTarget);
        const response = await fetch(`/api/crm/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            expectedUpdatedAt: task.updated_at,
            assignedTo: data.get('assignee') || null,
            title: task.title,
            description: task.description,
            dueAt: task.due_at,
            priority: task.priority,
            status: data.get('status'),
          }),
        });
        const result = await response.json().catch(() => ({}));
        setBusy(false);
        if (!response.ok) setMessage(result.error ?? 'Request failed');
        else window.location.reload();
      }}
    >
      <label>
        <span className="sr-only">Status for {task.title ?? 'task'}</span>
        <select name="status" defaultValue={task.status ?? 'OPEN'}>
          {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Assignee for {task.title ?? 'task'}</span>
        <select name="assignee" defaultValue={task.assigned_to ?? ''}>
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <button className="crm-button" disabled={busy}>
        Update
      </button>
      <span role="status">{message}</span>
    </form>
  );
}
