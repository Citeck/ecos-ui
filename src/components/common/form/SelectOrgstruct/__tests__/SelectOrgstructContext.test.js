/**
 * @jest-environment jsdom
 */
import { act, render } from '@testing-library/react';
import React from 'react';

import { SelectOrgstructContext, SelectOrgstructProvider } from '../SelectOrgstructContext';

const Consumer = ({ captureRef }) => {
  const ctx = React.useContext(SelectOrgstructContext);
  captureRef.current = ctx;
  return null;
};

const orgStructApiStub = {
  fetchAuthority: jest.fn(() => Promise.resolve(null))
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const setup = async (controlProps = {}) => {
  const captureRef = React.createRef();
  const defaultProps = {
    openByDefault: true,
    dataType: 'nodeRef',
    ...controlProps
  };
  await act(async () => {
    render(
      <SelectOrgstructProvider orgStructApi={orgStructApiStub} controlProps={defaultProps}>
        <Consumer captureRef={captureRef} />
      </SelectOrgstructProvider>
    );
    await flushPromises();
  });
  return captureRef;
};

describe('SelectOrgstructContext', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('closeSelectModal closes the modal without firing controlProps.onCancelSelect', async () => {
    const onCancelSelect = jest.fn();
    const ctxRef = await setup({ onCancelSelect });

    expect(ctxRef.current.isSelectModalOpen).toBe(true);

    act(() => {
      ctxRef.current.closeSelectModal();
    });

    expect(ctxRef.current.isSelectModalOpen).toBe(false);
    expect(onCancelSelect).not.toHaveBeenCalled();
  });

  it('toggleSelectModal fires controlProps.onCancelSelect when modal was open', async () => {
    const onCancelSelect = jest.fn();
    const ctxRef = await setup({ onCancelSelect });

    act(() => {
      ctxRef.current.toggleSelectModal();
    });

    expect(onCancelSelect).toHaveBeenCalledTimes(1);
  });

  it('toggleSelectModal does not fire onCancelSelect when opening a closed modal', async () => {
    const onCancelSelect = jest.fn();
    const ctxRef = await setup({ openByDefault: false, onCancelSelect });

    act(() => {
      ctxRef.current.toggleSelectModal();
    });

    expect(ctxRef.current.isSelectModalOpen).toBe(true);
    expect(onCancelSelect).not.toHaveBeenCalled();
  });

  it('onCancelSelect from context closes the modal and fires controlProps.onCancelSelect', async () => {
    const onCancelSelect = jest.fn();
    const ctxRef = await setup({ onCancelSelect });

    act(() => {
      ctxRef.current.onCancelSelect();
    });

    expect(ctxRef.current.isSelectModalOpen).toBe(false);
    expect(onCancelSelect).toHaveBeenCalledTimes(1);
  });
});
