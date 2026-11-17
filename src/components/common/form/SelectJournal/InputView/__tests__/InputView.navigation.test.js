import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import ViewMode from '../../ViewMode';
import { getFormattedLink } from '../../helpers';
import InputView from '../InputView';

import PageService from '@/services/PageService';

jest.mock('@citeck/records-core', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../../../../common', () => ({ __esModule: true, Tooltip: ({ children }) => <>{children}</> }));
jest.mock('../../../../../common/btns', () => ({
  __esModule: true,
  Btn: ({ children, ...rest }) => (
    <button role={rest.role} disabled={rest.disabled}>
      {children}
    </button>
  ),
  IcoBtn: ({ children }) => <button>{children}</button>
}));
jest.mock('../../../../../common/grid', () => ({ __esModule: true, Grid: () => <div data-testid="grid" /> }));
jest.mock('../../../../grid/InlineTools/InlineToolsDisconnected', () => ({ __esModule: true, default: () => null }));
jest.mock('../../CreateVariants', () => ({ __esModule: true, default: () => null }));
jest.mock('../../CreateVariants/MenuCreateVariants', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/core/Records/actions/handler/executor/DebugFormAction', () => ({ __esModule: true, default: {} }));
jest.mock('@/components/core/Records/actions/recordActions', () => ({ __esModule: true, default: {} }));
jest.mock('@/services/notifications', () => ({ __esModule: true, NotificationManager: { error: jest.fn() } }));

jest.mock('@/services/PageService', () => ({
  __esModule: true,
  default: { changeUrlLink: jest.fn(), isTypeRecord: () => false }
}));
jest.mock('@/services/pageTabs/PageTabList', () => ({
  __esModule: true,
  default: { setLastActiveTabWs: jest.fn() }
}));
jest.mock('@/helpers/util', () => ({
  ...jest.requireActual('@/helpers/util'),
  getEnabledWorkspaces: () => true,
  getDefaultWorkspace: () => 'current'
}));

const selectedRows = [{ id: 'emodel/thing@1', disp: 'One', locatedWorkspaceId: 'related' }];
const baseProps = { journalId: 'j1', selectedRows, viewMode: 'default' };
const clickName = container => {
  const target = container.querySelector('.assoc-value');
  fireEvent.mouseDown(target, { button: 0 });
  fireEvent.mouseUp(target, { button: 0 });
  fireEvent.click(target, { button: 0 });
};

beforeEach(() => jest.clearAllMocks());

describe.each([false, true])('InputView modal=%s', isModalMode => {
  it.each([undefined, true, false])('uses policy %s without losing explicit false', openNewBrowserTab => {
    const openSelectModal = jest.fn();
    const { container } = render(
      <InputView {...baseProps} isModalMode={isModalMode} openNewBrowserTab={openNewBrowserTab} openSelectModal={openSelectModal} />
    );
    clickName(container);
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
    expect(openSelectModal).not.toHaveBeenCalled();
    expect(!!PageService.changeUrlLink.mock.calls[0][1].openNewBrowserTab).toBe(
      typeof openNewBrowserTab === 'boolean' ? openNewBrowserTab : isModalMode
    );
  });
});

describe('selected record link navigation', () => {
  it.each([undefined, true, false])('ViewMode list uses policy %s and legacy internal fallback even in a modal', openNewBrowserTab => {
    const { container } = render(<ViewMode {...baseProps} isModalMode openNewBrowserTab={openNewBrowserTab} />);
    clickName(container);
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
    expect(!!PageService.changeUrlLink.mock.calls[0][1].openNewBrowserTab).toBe(openNewBrowserTab === true);
  });

  it('updates the mounted InputView for policy-only and modal-fallback-only changes', () => {
    const { container, rerender } = render(<InputView {...baseProps} isModalMode openNewBrowserTab />);
    for (const [policy, modal, expected] of [
      [false, true, false],
      [undefined, true, true],
      [undefined, false, false]
    ]) {
      PageService.changeUrlLink.mockClear();
      rerender(<InputView {...baseProps} isModalMode={modal} openNewBrowserTab={policy} />);
      clickName(container);
      expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
      expect(!!PageService.changeUrlLink.mock.calls[0][1].openNewBrowserTab).toBe(expected);
    }
  });

  it.each([InputView, ViewMode])('%p keeps actual formatting, recordRef, and located workspace', View => {
    const formatter = 'link => link + "-formatted"';
    const { container } = render(<View {...baseProps} linkFormatter={formatter} openNewBrowserTab />);
    clickName(container);
    const [url, params] = PageService.changeUrlLink.mock.calls[0];
    const parsed = new URL(url, window.location.origin);
    expect(parsed.pathname).toBe('/v2/dashboard');
    expect(parsed.searchParams.get('recordRef')).toBe('emodel/thing@1-formatted');
    expect(parsed.searchParams.get('ws')).toBe('related');
    expect(params.openNewBrowserTab).toBe(true);
  });

  it.each([InputView, ViewMode])('%p preserves a formatter-supplied URL and its query parameters', View => {
    const url = '/v2/dashboard?recordRef=emodel/other@2&ws=formatted&tab=details';
    const { container } = render(<View {...baseProps} linkFormatter={`() => ${JSON.stringify(url)}`} openNewBrowserTab={false} />);
    clickName(container);
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
    const actual = new URL(PageService.changeUrlLink.mock.calls[0][0], window.location.origin);
    expect(actual.searchParams.get('recordRef')).toBe('emodel/other@2');
    expect(actual.searchParams.get('ws')).toBe('formatted');
    expect(actual.searchParams.get('tab')).toBe('details');
    expect(PageService.changeUrlLink.mock.calls[0][1].openNewBrowserTab).toBeFalsy();
  });

  it.each([InputView, ViewMode])('%p leaves the unformatted legacy URL unchanged', View => {
    const expected = getFormattedLink({ item: selectedRows[0] });
    const { container } = render(<View {...baseProps} />);
    clickName(container);
    const actual = new URL(PageService.changeUrlLink.mock.calls[0][0], window.location.origin);
    const original = new URL(expected, window.location.origin);
    expect(actual.toString()).toBe(original.toString());
  });

  it.each([InputView, ViewMode])('%p renders selected text without a clickable link or navigation', View => {
    const { container, getByText } = render(<View {...baseProps} isSelectedValueAsText openNewBrowserTab />);
    expect(container.querySelector('.assoc-value_link, a')).toBeNull();
    fireEvent.click(getByText('One'));
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { button: 1 }])(
    'does not open the picker for browser gesture %j on a selected link',
    options => {
      const openSelectModal = jest.fn();
      const { container } = render(<InputView {...baseProps} isModalMode openNewBrowserTab={false} openSelectModal={openSelectModal} />);
      const target = container.querySelector('.assoc-value_link');
      fireEvent.mouseDown(target, { button: 0, ...options });
      fireEvent.mouseUp(target, { button: 0, ...options });
      if (options.button === 1) {
        fireEvent(target, new MouseEvent('auxclick', { bubbles: true, button: 1 }));
      } else {
        fireEvent.click(target, { button: 0, ...options });
      }
      expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
      expect(PageService.changeUrlLink.mock.calls[0][1].openNewBrowserTab).toBe(true);
      expect(openSelectModal).not.toHaveBeenCalled();
    }
  );

  it.each(['.select-journal__values-list', '.select-journal_action_open-modal'])(
    'still opens the picker from %s rather than navigating',
    selector => {
      const openSelectModal = jest.fn();
      const { container } = render(<InputView {...baseProps} openNewBrowserTab openSelectModal={openSelectModal} />);
      fireEvent.click(container.querySelector(selector));
      expect(openSelectModal).toHaveBeenCalledTimes(1);
      expect(PageService.changeUrlLink).not.toHaveBeenCalled();
    }
  );

  it('keeps a text-only selected value usable for choosing another record', () => {
    const openSelectModal = jest.fn();
    const { getByText } = render(<InputView {...baseProps} isSelectedValueAsText openNewBrowserTab openSelectModal={openSelectModal} />);
    fireEvent.click(getByText('One'));
    expect(openSelectModal).toHaveBeenCalledTimes(1);
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it('keeps multiple selected links and unsaved form data without also opening the picker', () => {
    const openSelectModal = jest.fn();
    const { container, getByDisplayValue } = render(
      <form>
        <input defaultValue="unsaved draft" />
        <InputView
          {...baseProps}
          multiple
          openSelectModal={openSelectModal}
          selectedRows={[...selectedRows, { id: 'emodel/thing@2', disp: 'Two' }]}
          openNewBrowserTab
        />
      </form>
    );
    expect(container.querySelectorAll('.assoc-value_link')).toHaveLength(2);
    clickName(container);
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
    expect(openSelectModal).not.toHaveBeenCalled();
    expect(getByDisplayValue('unsaved draft')).not.toBeNull();
  });
});
