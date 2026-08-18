import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';

import Formio from 'formiojs/Formio';

import { flush, installCreateForm } from '@/components/common/dialogs/Manager/formioTestUtils';
import { getCardDetailsLink } from '@/helpers/urls';

import Card from '../Card';

// The real module drags in the whole record actions registry, which cannot be loaded in jsdom
jest.mock('@/components/core/Records/actions/handler/executor/ViewAction', () => ({
  __esModule: true,
  default: { ACTION_ID: 'view' }
}));

jest.mock('react-beautiful-dnd', () => ({
  Draggable: ({ children }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, { isDragging: false })
}));

jest.mock('react-resize-detector', () => ({
  __esModule: true,
  default: () => null
}));

// The real FormWrapper is used on purpose — the card body is a formio form and how often it is
// rebuilt is the whole point of the assertions below. Only formio itself is stubbed.
jest.mock('@/components/common/dialogs', () => ({
  FormWrapper: require('@/components/common/dialogs/Manager/FormWrapperWithRef').default
}));

jest.mock('formiojs/Formio', () => ({
  __esModule: true,
  default: {
    createForm: jest.fn()
  }
}));

jest.mock('@/helpers/export/util', () => ({
  getCurrentLocale: () => 'en'
}));

jest.mock('@/components/forms/EcosForm/EcosFormUtils', () => ({
  __esModule: true,
  default: {
    getI18n: () => ({}),
    preProcessFormDefinition: definition => definition
  }
}));

jest.mock('@/components/common', () => {
  const React = require('react');

  return {
    Icon: props => <i {...props} />,
    Tooltip: ({ children }) => children
  };
});

jest.mock('@/components/common/form', () => ({
  DropdownOuter: ({ children }) => children
}));

const CARD_REF = 'emodel/ept-issue@TEST2-1';

const baseProps = {
  data: { id: CARD_REF, cardId: CARD_REF, cardTitle: 'TEST2-1 - card title' },
  cardIndex: 0,
  readOnly: true,
  boardConfig: {},
  formProps: {}
};

const getTitleLink = container => container.querySelector('a.ecos-kanban__card-label_main');

describe('<Card /> record link', () => {
  it('should render the card title as a link to the record dashboard', () => {
    const { container } = render(<Card {...baseProps} />);
    const link = getTitleLink(container);

    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe(getCardDetailsLink(CARD_REF));
    expect(link.textContent).toBe('TEST2-1 - card title');
  });

  it('should open the record inside the application on a plain left click', () => {
    const onClickAction = jest.fn();
    const { container } = render(<Card {...baseProps} onClickAction={onClickAction} />);

    const notPrevented = fireEvent.click(getTitleLink(container));

    expect(notPrevented).toBe(false);
    expect(onClickAction).toHaveBeenCalledWith(CARD_REF, { type: 'view' });
  });

  it('should let the browser handle a middle click, so the record opens in a new browser tab', () => {
    const onClickAction = jest.fn();
    const { container } = render(<Card {...baseProps} onClickAction={onClickAction} />);

    const notPrevented = fireEvent.click(getTitleLink(container), { button: 1 });

    expect(notPrevented).toBe(true);
    expect(onClickAction).not.toHaveBeenCalled();
  });

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey']])('should let the browser handle a click with %s pressed', modifier => {
    const onClickAction = jest.fn();
    const { container } = render(<Card {...baseProps} onClickAction={onClickAction} />);

    const notPrevented = fireEvent.click(getTitleLink(container), { [modifier]: true });

    expect(notPrevented).toBe(true);
    expect(onClickAction).not.toHaveBeenCalled();
  });

  it('should render a link instead of the title when titles are disabled on the board', () => {
    const onClickAction = jest.fn();
    const { container } = render(<Card {...baseProps} boardConfig={{ disableTitle: true }} onClickAction={onClickAction} />);

    const link = container.querySelector('a.ecos-kanban__card-action-show');

    expect(getTitleLink(container)).toBeNull();
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe(getCardDetailsLink(CARD_REF));

    expect(fireEvent.click(link)).toBe(false);
    expect(onClickAction).toHaveBeenCalledWith(CARD_REF, { type: 'view' });
  });
});

describe('<Card /> body rebuilds', () => {
  const CARD_FORM_PROPS = {
    formDefinition: { components: [{ type: 'textfield', key: 'title' }] }
  };

  const cardData = status => ({
    id: CARD_REF,
    cardId: CARD_REF,
    cardTitle: 'TEST2-1 - card title',
    title: 'TEST2-1',
    _colorAttrValue: status
  });

  let forms;

  beforeEach(() => {
    forms = installCreateForm(Formio.createForm);
  });

  it('should build the card form once on mount', async () => {
    render(<Card {...baseProps} formProps={CARD_FORM_PROPS} data={cardData('backlog')} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
  });

  it('should not rebuild the form when the record data is replaced by an equal object', async () => {
    const { rerender } = render(<Card {...baseProps} formProps={CARD_FORM_PROPS} data={cardData('backlog')} />);
    await flush();

    rerender(<Card {...baseProps} formProps={CARD_FORM_PROPS} data={cardData('backlog')} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    expect(forms[0].destroy).not.toHaveBeenCalled();
  });

  /**
   * The move settles with a real change — the colored status attribute the card is grouped by.
   * The card must show the new value without being rebuilt a second time.
   */
  it('should update the values in place when the moved card comes back with a new status', async () => {
    const { rerender } = render(<Card {...baseProps} formProps={CARD_FORM_PROPS} data={cardData('backlog')} />);
    await flush();
    forms[0].setValue.mockClear();

    rerender(<Card {...baseProps} formProps={CARD_FORM_PROPS} data={cardData('done')} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    expect(forms[0].setValue).toHaveBeenCalledTimes(1);
    expect(forms[0].setValue.mock.calls[0][0].data._colorAttrValue).toBe('done');
    expect(forms[0].redraw).toHaveBeenCalledTimes(1);
  });
});

/**
 * The height detector's debounce lives on the instance so that resize bursts share one timer and
 * the unmount can cancel it. Driven directly on an instance — react-resize-detector is stubbed out
 * in the rendered tree above.
 */
describe('<Card /> height detection debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should coalesce a resize burst into one trailing state commit', () => {
    const instance = new Card(baseProps);
    instance.setState = jest.fn();

    instance.handleDetectHeight(100, 40);
    instance.handleDetectHeight(100, 0);

    jest.advanceTimersByTime(399);
    expect(instance.setState).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(instance.setState).toHaveBeenCalledTimes(1);
    expect(instance.setState).toHaveBeenCalledWith({ noForm: true });
  });

  it('should cancel the pending commit on unmount', () => {
    const instance = new Card(baseProps);
    instance.setState = jest.fn();

    instance.handleDetectHeight(100, 40);
    instance.componentWillUnmount();
    jest.runAllTimers();

    expect(instance.setState).not.toHaveBeenCalled();
  });
});
