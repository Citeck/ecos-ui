import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import { SelectOrgstructContext } from '../SelectOrgstructContext';
import InputView from '../components/InputView';
import ViewMode from '../components/ViewMode';

import PageService from '@/services/PageService';

jest.mock('../SelectOrgstructContext', () => ({ SelectOrgstructContext: require('react').createContext() }));
jest.mock('@/components/common', () => ({ Tooltip: ({ children }) => <>{children}</> }));
jest.mock('@/components/common/Tags', () => () => null);
jest.mock('@/services/PageService', () => ({ __esModule: true, default: { changeUrlLink: jest.fn() } }));

const selectedRows = [
  { id: 'group', label: 'Group', attributes: { authorityType: 'GROUP', nodeRef: 'emodel/group@1' } },
  { id: 'user', label: 'User', attributes: { authorityType: 'USER', fullName: 'person' } }
];

const gesture = target => {
  fireEvent.mouseDown(target, { button: 0 });
  fireEvent.mouseUp(target, { button: 0 });
  fireEvent.click(target, { button: 0 });
};

beforeEach(() => jest.clearAllMocks());

describe('SelectOrgstruct shared AssocLink regression', () => {
  it.each([false, true])('InputView retains its inline=%s browser/internal policy and editable form', isInlineEditingMode => {
    const toggleSelectModal = jest.fn();
    const { getByText, getByDisplayValue } = render(
      <form>
        <input defaultValue="unsaved draft" />
        <SelectOrgstructContext.Provider value={{ selectedRows, controlProps: { isInlineEditingMode }, toggleSelectModal }}>
          <InputView />
        </SelectOrgstructContext.Provider>
      </form>
    );
    gesture(getByText('Group'));
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(1);
    expect(PageService.changeUrlLink).toHaveBeenCalledWith(
      expect.stringContaining('recordRef=emodel/group@1'),
      expect.objectContaining({ openNewBrowserTab: !isInlineEditingMode, openNewTab: true, reopen: true, closeActiveTab: false })
    );
    expect(toggleSelectModal).not.toHaveBeenCalled();
    expect(getByDisplayValue('unsaved draft')).not.toBeNull();
    gesture(getByText('User'));
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(2);
    expect(PageService.changeUrlLink.mock.calls[1][1].openNewBrowserTab).toBe(!isInlineEditingMode);
    expect(toggleSelectModal).not.toHaveBeenCalled();
  });

  it.each(['.select-orgstruct__input-view', '[role="choice-control"]'])('still opens the orgstruct picker from %s', selector => {
    const toggleSelectModal = jest.fn();
    const { container } = render(
      <SelectOrgstructContext.Provider value={{ selectedRows, controlProps: {}, toggleSelectModal }}>
        <InputView />
      </SelectOrgstructContext.Provider>
    );
    fireEvent.click(container.querySelector(selector));
    expect(toggleSelectModal).toHaveBeenCalledTimes(1);
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });

  it('ViewMode keeps group and user records internal', () => {
    const { getByText } = render(
      <SelectOrgstructContext.Provider value={{ selectedRows, controlProps: {} }}>
        <ViewMode />
      </SelectOrgstructContext.Provider>
    );
    gesture(getByText('Group'));
    gesture(getByText('User'));
    expect(PageService.changeUrlLink).toHaveBeenCalledTimes(2);
    expect(PageService.changeUrlLink.mock.calls[0][1].openNewBrowserTab).toBe(false);
    expect(PageService.changeUrlLink.mock.calls[1][1].openNewBrowserTab).toBe(false);
  });

  it.each([InputView, ViewMode])('%p preserves text-only values and does not navigate', View => {
    const { container, getByText } = render(
      <SelectOrgstructContext.Provider value={{ selectedRows, controlProps: { isSelectedValueAsText: true } }}>
        <View />
      </SelectOrgstructContext.Provider>
    );
    expect(container.querySelector('.assoc-value_link')).toBeNull();
    gesture(getByText('Group'));
    expect(PageService.changeUrlLink).not.toHaveBeenCalled();
  });
});
