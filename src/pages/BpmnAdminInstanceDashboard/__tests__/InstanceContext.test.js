import { render } from '@testing-library/react';
import React, { useContext } from 'react';

import { InstanceContext, InstanceContextProvider } from '../InstanceContext';

const LOCATION_REF = 'emodel/person@jane.doe';
const TAB_REF = 'eproc/bpmn-proc@abc';

const Probe = () => {
  const { instanceId, dispInstanceId } = useContext(InstanceContext);

  return (
    <>
      <span data-testid="instance-id">{instanceId}</span>
      <span data-testid="disp-instance-id">{dispInstanceId}</span>
    </>
  );
};

describe('InstanceContextProvider', () => {
  beforeEach(() => {
    // The active app tab is a user profile, while the instance-admin page stays mounted (hidden).
    window.history.replaceState({}, '', `/v2/bpmn-instance?recordRef=${LOCATION_REF}`);
  });

  afterAll(() => {
    window.history.replaceState({}, '', '/');
  });

  it('takes the record ref from tabLink, not from window.location', () => {
    const { getByTestId } = render(
      <InstanceContextProvider tabLink={`/v2/bpmn-instance?ws=user$admin&recordRef=${TAB_REF}`}>
        <Probe />
      </InstanceContextProvider>
    );

    expect(getByTestId('instance-id').textContent).toBe(TAB_REF);
    expect(getByTestId('disp-instance-id').textContent).toBe('abc');
  });

  it('falls back to window.location when there is no tabLink (page tabs disabled)', () => {
    const { getByTestId } = render(
      <InstanceContextProvider>
        <Probe />
      </InstanceContextProvider>
    );

    expect(getByTestId('instance-id').textContent).toBe(LOCATION_REF);
    expect(getByTestId('disp-instance-id').textContent).toBe('jane.doe');
  });

  it('follows tabLink changes inside the same tab', () => {
    const { getByTestId, rerender } = render(
      <InstanceContextProvider tabLink={`/v2/bpmn-instance?recordRef=${TAB_REF}`}>
        <Probe />
      </InstanceContextProvider>
    );

    expect(getByTestId('instance-id').textContent).toBe(TAB_REF);

    rerender(
      <InstanceContextProvider tabLink="/v2/bpmn-instance?recordRef=eproc/bpmn-proc@other">
        <Probe />
      </InstanceContextProvider>
    );

    expect(getByTestId('instance-id').textContent).toBe('eproc/bpmn-proc@other');
  });
});
