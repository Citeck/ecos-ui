import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import ConnectedSettings from '../Settings';

import DialogManager from '@/components/common/dialogs/Manager';

jest.mock('@/components/common', () => ({
  EcosModal: ({ children }) => <div>{children}</div>,
  Loader: () => <div role="status">Loading</div>,
  Tabs: () => <div>Editor tabs</div>
}));
jest.mock('../editorMenu/EditorLeftMenu', () => () => <button>Add section</button>);
jest.mock('../editorMenu/EditorCreateMenu', () => () => null);
jest.mock('../editorMenu/EditorUserMenu', () => () => null);
jest.mock('../editorMenu/EditorOwnership', () => () => <div>Access settings</div>);
jest.mock('../EditorGroupPriority', () => () => null);
jest.mock('@/components/common/dialogs/Manager', () => ({ confirmDialog: jest.fn() }));

const Settings = ConnectedSettings.WrappedComponent;
const props = () => ({
  editedId: 'test-menu',
  configLoadStatus: 'loaded',
  isLoading: false,
  isForAll: true,
  authorities: [],
  loadSettings: jest.fn(),
  saveSettings: jest.fn()
});

it.each(['idle', 'loading', 'error'])('does not mount editors or allow apply in %s state', configLoadStatus => {
  const p = { ...props(), configLoadStatus };
  const ref = React.createRef();
  render(<Settings ref={ref} {...p} />);
  expect(screen.queryByText('Add section')).not.toBeInTheDocument();
  expect(screen.queryByText('Access settings')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'menu-settings.button.apply' })).toBeDisabled();
  ref.current.handleApply();
  expect(p.saveSettings).not.toHaveBeenCalled();
});

it('shows a persistent error and retries the same configuration, preserving view mode', () => {
  const p = { ...props(), configLoadStatus: 'error', disabledEdit: true };
  render(<Settings {...p} />);
  expect(screen.getByRole('alert')).toHaveTextContent('menu-settings.error.get-config');
  fireEvent.click(screen.getByRole('button', { name: 'menu-settings.button.retry' }));
  expect(p.loadSettings).toHaveBeenCalledWith({ id: 'test-menu', disabledEdit: true });
});

it('enables the editor only after success and disables save while busy', () => {
  const p = props();
  const view = render(<Settings {...p} />);
  expect(screen.getByText('Add section')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'menu-settings.button.apply' }));
  expect(p.saveSettings).toHaveBeenCalledTimes(1);
  view.rerender(<Settings {...p} isLoading />);
  expect(screen.getByRole('button', { name: 'menu-settings.button.apply' })).toBeDisabled();
});

it('rechecks readiness when a previously opened access confirmation is accepted', () => {
  const p = { ...props(), isForAll: false };
  const view = render(<Settings {...p} />);
  fireEvent.click(screen.getByRole('button', { name: 'menu-settings.button.apply' }));
  const { onYes } = DialogManager.confirmDialog.mock.calls.at(-1)[0];
  view.rerender(<Settings {...p} configLoadStatus="loading" />);
  onYes();
  expect(p.saveSettings).not.toHaveBeenCalled();
});
