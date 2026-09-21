import Records from '@citeck/records-core';
import { act, render } from '@testing-library/react';
import React from 'react';

import TaskAssignmentPanel from '../TaskAssignmentPanel';

import { TasksApi } from '@/api/tasks';
import { EVENTS } from '@/components/dashboard/widgets/BaseWidget';

jest.mock('@/api/recordActions', () => ({ RecordActionsApi: class {} }));
jest.mock('@/api/tasks', () => ({
  TasksApi: {
    getDocument: jest.fn(),
    getStaticTaskStateAssignee: jest.fn(() => new Promise(() => {}))
  }
}));

// The panel listens on the task's *document* record, which it learns asynchronously. That record
// is a global Records.get(ref) cache entry, so a listener left behind on unmount piles up on each
// re-open of the task (COREDEV-522).
describe('TaskAssignmentPanel record event listeners', () => {
  const taskId = 'eproc/task@assignment-listeners';
  const documentRef = 'emodel/doc@assignment-listeners';
  const count = () => Records.get(documentRef).events.listenerCount(EVENTS.UPDATE_TASKS_WIDGETS);
  const flushPromises = () => act(() => Promise.resolve());

  beforeEach(() => {
    TasksApi.getDocument.mockImplementation(() => Promise.resolve(documentRef));
  });

  const mount = () => render(<TaskAssignmentPanel taskId={taskId} stateAssign={{ claimable: true }} />);

  it('listens once the document is known and stops listening on unmount', async () => {
    const wrapper = mount();
    await flushPromises();
    expect(count()).toBe(1);

    wrapper.unmount();
    expect(count()).toBe(0);
  });

  it('does not pile up listeners when the same task is opened again and again', async () => {
    for (let i = 0; i < 5; i++) {
      const wrapper = mount();
      await flushPromises();
      wrapper.unmount();
    }

    expect(count()).toBe(0);
  });

  it('does not subscribe when the document arrives after the panel has gone', async () => {
    let resolveDocument;
    TasksApi.getDocument.mockImplementation(() => new Promise(resolve => (resolveDocument = resolve)));

    const wrapper = mount();
    wrapper.unmount();
    await act(async () => {
      resolveDocument(documentRef);
      await Promise.resolve();
    });

    expect(count()).toBe(0);
  });
});
