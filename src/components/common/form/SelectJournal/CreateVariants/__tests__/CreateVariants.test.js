jest.mock('@/components/forms/EcosForm/FormManager', () => ({
  __esModule: true,
  default: { createRecordByVariant: jest.fn() }
}));

// The real Btn/Dropdown pull in common/form/index → journals service → sagas → store
// and blow up on a circular import. openForm does not depend on their internals.
jest.mock('../../../../btns', () => {
  const react = require('react');

  const stub = ({ children, ...props }) => react.createElement('button', props, children);

  return { __esModule: true, Btn: stub, IcoBtn: stub };
});

jest.mock('../../../Dropdown/Dropdown', () => {
  const react = require('react');

  return {
    __esModule: true,
    default: ({ source, onChange }) =>
      react.createElement(
        'div',
        null,
        (source || []).map((item, i) =>
          react.createElement('button', { key: i, onClick: () => onChange(item) }, item.title)
        )
      )
  };
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import FormManager from '@/components/forms/EcosForm/FormManager';

import CreateVariants from '../CreateVariants';

const VARIANT = { type: 'release', title: 'Release', destination: 'emodel/task@task-1', attributes: { foo: 'bar' } };

const clickCreate = async () => {
  await userEvent.click(screen.getByRole('button'));
};

describe('CreateVariants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets _workspace when the workspace is known', async () => {
    render(<CreateVariants items={[VARIANT]} getCreateWorkspaceId={async () => 'proj1'} onCreateFormSubmit={jest.fn()} />);

    await clickCreate();

    expect(FormManager.createRecordByVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'release',
        attributes: { foo: 'bar', _workspace: 'emodel/workspace@proj1' }
      }),
      expect.any(Object)
    );
  });

  it('leaves the variant untouched when the workspace is empty', async () => {
    render(<CreateVariants items={[VARIANT]} getCreateWorkspaceId={async () => ''} onCreateFormSubmit={jest.fn()} />);

    await clickCreate();

    expect(FormManager.createRecordByVariant).toHaveBeenCalledWith(VARIANT, expect.any(Object));
  });

  it('works without getCreateWorkspaceId — backward compatibility', async () => {
    render(<CreateVariants items={[VARIANT]} onCreateFormSubmit={jest.fn()} />);

    await clickCreate();

    expect(FormManager.createRecordByVariant).toHaveBeenCalledWith(VARIANT, expect.any(Object));
  });

  it('does not drop destination, which FormManager turns into _parent', async () => {
    render(<CreateVariants items={[VARIANT]} getCreateWorkspaceId={async () => 'proj1'} onCreateFormSubmit={jest.fn()} />);

    await clickCreate();

    expect(FormManager.createRecordByVariant.mock.calls[0][0].destination).toBe('emodel/task@task-1');
  });

  it('sets _workspace on a variant that has no attributes of its own', async () => {
    render(
      <CreateVariants
        items={[{ type: 'release', title: 'Release' }]}
        getCreateWorkspaceId={async () => 'proj1'}
        onCreateFormSubmit={jest.fn()}
      />
    );

    await clickCreate();

    expect(FormManager.createRecordByVariant.mock.calls[0][0].attributes).toEqual({ _workspace: 'emodel/workspace@proj1' });
  });
});
