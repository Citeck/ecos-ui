import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import IcoBtn from '../IcoBtn';

jest.mock('../../../Loader/Loader', () => ({ __esModule: true, default: () => <div data-testid="loader" /> }));

describe('IcoBtn', () => {
  it('does not pass the icon prop to markup for an element icon', () => {
    render(<IcoBtn icon={<svg data-testid="svg-icon" />} />);

    const button = screen.getByRole('button');
    expect(button.hasAttribute('icon')).toBe(false);

    const icon = screen.getByTestId('svg-icon');
    expect(icon.getAttribute('class')).toContain('ecos-btn__i');
  });

  it('does not pass the icon prop to markup for a string icon', () => {
    const { container } = render(<IcoBtn icon="fa fa-plus" />);

    const button = screen.getByRole('button');
    expect(button.hasAttribute('icon')).toBe(false);

    const icon = container.querySelector('i');
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('class')).toContain('ecos-btn__i');
    expect(icon.getAttribute('class')).toContain('fa');
    expect(icon.getAttribute('class')).toContain('fa-plus');
  });

  it('passes the remaining props to markup', () => {
    render(
      <IcoBtn id="the-btn" aria-label="The button" disabled icon="fa fa-plus">
        Text
      </IcoBtn>
    );

    const button = screen.getByRole('button', { name: 'The button' });
    expect(button.getAttribute('id')).toBe('the-btn');
    expect(button.disabled).toBe(true);
  });

  // The handler is the prop whose loss would be felt across every call site, and pulling `icon` out
  // of the spread is exactly the kind of change that can take a neighbour with it — so it is
  // checked by firing, not by its presence in the markup (an `onClick` never lands there).
  it('still reaches the button with onClick', () => {
    const onClick = jest.fn();
    render(
      <IcoBtn aria-label="The button" onClick={onClick} icon="fa fa-plus">
        Text
      </IcoBtn>
    );

    fireEvent.click(screen.getByRole('button', { name: 'The button' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render the icon while loading', () => {
    const { container } = render(<IcoBtn icon="fa fa-plus" loading />);

    expect(screen.getByTestId('loader')).toBeTruthy();
    expect(container.querySelector('i')).toBeNull();
  });
});
