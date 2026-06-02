import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Pagination from '../Pagination';

jest.mock('@/helpers/util', () => ({
  t: key => key
}));

jest.mock('../../../common/btns', () => ({
  IcoBtn: ({ children, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} data-testid={rest.className}>
      {children}
    </button>
  )
}));

jest.mock('../../../common/form/Select', () => {
  return function MockSelect() {
    return <div data-testid="select" />;
  };
});

jest.mock('../../icons/FillChevronLeft', () => {
  return function MockChevronLeft() {
    return <span>left</span>;
  };
});

jest.mock('../../icons/FillChevronRight', () => {
  return function MockChevronRight() {
    return <span>right</span>;
  };
});

const getDisplayedRange = container => {
  const currentEl = container.querySelector('.ecos-pagination__text-current');
  return currentEl ? currentEl.textContent : null;
};

describe('Pagination', () => {
  it('renders correct range on first load', () => {
    const { container } = render(<Pagination page={1} maxItems={10} total={20} />);
    expect(getDisplayedRange(container)).toBe('1-10');
  });

  it('returns null when total is 0', () => {
    const { container } = render(<Pagination page={1} maxItems={10} total={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('resets displayed range when page prop is externally reset to 1 (filter from page 2)', () => {
    const { container, rerender } = render(<Pagination page={2} maxItems={25} total={50} />);
    expect(getDisplayedRange(container)).toBe('26-50');

    rerender(<Pagination page={1} maxItems={25} total={17} />);
    expect(getDisplayedRange(container)).toBe('1-17');
  });

  it('syncs state when page prop changes to any value different from local state', () => {
    const { container, rerender } = render(<Pagination page={1} maxItems={10} total={100} />);
    expect(getDisplayedRange(container)).toBe('1-10');

    rerender(<Pagination page={5} maxItems={10} total={100} />);
    expect(getDisplayedRange(container)).toBe('41-50');
  });

  it('does not cause issues when user navigates via next button', () => {
    const onChange = jest.fn();
    const { container, rerender } = render(<Pagination page={1} maxItems={10} total={30} onChange={onChange} />);
    expect(getDisplayedRange(container)).toBe('1-10');

    const rightBtn = container.querySelector('[data-testid*="arrow-right"]');
    fireEvent.click(rightBtn);

    expect(onChange).toHaveBeenCalledWith({ skipCount: 10, maxItems: 10, page: 2 });

    rerender(<Pagination page={2} maxItems={10} total={30} onChange={onChange} />);
    expect(getDisplayedRange(container)).toBe('11-20');
  });

  it('syncs state when searching prop transitions to true', () => {
    const { container, rerender } = render(<Pagination page={2} maxItems={10} total={30} searching={false} />);
    expect(getDisplayedRange(container)).toBe('11-20');

    rerender(<Pagination page={1} maxItems={10} total={5} searching={true} />);
    expect(getDisplayedRange(container)).toBe('1-5');
  });
});
