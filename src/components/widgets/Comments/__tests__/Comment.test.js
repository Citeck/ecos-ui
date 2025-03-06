import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';

import { Comment } from '../Comment';

console.error = jest.fn();

const baseProps = {
  id: 'comment-id@1',
  comment: {
    text: 'Comment',
    firstName: 'Admin',
    lastName: 'Administratorov',
    middleName: 'Adminovich',
  },
};

const mutationObserverMock = jest.fn(function MutationObserver(callback) {
  this.observe = jest.fn();
  this.disconnect = jest.fn();
  // Optionally add a trigger() method to manually trigger a change
  this.trigger = (mockedMutationsList) => {
    callback(mockedMutationsList, this);
  };
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.MutationObserver = mutationObserverMock;
global.getSelection = () => '';

describe('Comment tests', () => {
  const mockStore = configureStore();

  it('should render Comment component', () => {
    const { container } = render(
      <Provider
        store={mockStore({
          comments: [
            {
              text: 'Comment text with tags',
              firstName: 'Admin',
              middleName: 'Adminovich',
              tags: [{ name: 'Tester' }, { type: 'task', name: '№1 (01.01.2021)' }, { type: 'action', name: '№22 (09.02.2021)' }],
            },
          ],
        })}
      >
        <Comment {...baseProps} />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render Comment component with opened delete confirm dialog', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Provider
        store={mockStore({
          comments: [
            {
              text: 'Comment',
              firstName: 'Admin',
              middleName: 'Adminovich',
            },
          ],
        })}
      >
        <Comment {...baseProps} />
      </Provider>,
    );

    await user.click(container);

    expect(screen.getByText('Admin Adminovich')).toBeInTheDocument();
  });

  it('should render Comment component with tags', () => {
    const { container } = render(
      <Provider
        store={mockStore({
          comments: [
            {
              text: 'Comment text with tags',
              firstName: 'Admin',
              middleName: 'Adminovich',
              tags: [{ name: 'Tester' }, { type: 'task', name: '№1 (01.01.2021)' }, { type: 'action', name: '№22 (09.02.2021)' }],
            },
          ],
        })}
      >
        <Comment {...baseProps} />
      </Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});
