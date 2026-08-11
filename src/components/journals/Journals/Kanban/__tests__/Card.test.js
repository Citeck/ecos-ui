import { fireEvent, render } from '@testing-library/react';
import React from 'react';

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

jest.mock('@/components/common/dialogs', () => ({
  FormWrapper: () => null
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
