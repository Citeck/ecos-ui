import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';

import Comments from '../Comments';

import { fetchEnd, fetchStart, setComments } from '@/actions/comments';
import commentsReducer from '@/reducers/comments';
import { Events } from '@/services/PageService';

// getRecordRef intentionally returns an empty string under NODE_ENV=test; use browser semantics here.
jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  getRecordRef: () => new URL(global.window.location.href).searchParams.get('recordRef') || ''
}));

jest.mock('@/services/PageService', () => ({ Events: { CHANGE_URL_LINK_EVENT: 'change-test-tab' } }));
jest.mock('@/components/dashboard/widgets/BaseWidget', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: class extends React.Component {
      state = {};
      instanceRecord = { events: { on: jest.fn(), off: jest.fn() } };
      componentDidMount() {}
      componentWillUnmount() {}
    },
    EVENTS: {}
  };
});
jest.mock('@/components/dashboard/Dashlet', () => ({ children, customActions }) => (
  <div>
    {customActions}
    {children}
  </div>
));
jest.mock('@/components/common', () => ({ Tooltip: ({ children }) => children }));
jest.mock('@/components/common/btns/index', () => ({ IcoBtn: ({ onClick }) => <button onClick={onClick}>Add comment</button> }));
jest.mock('react-custom-scrollbars', () => ({ Scrollbars: ({ children }) => <div>{children}</div> }));
// Stateful editor double: replacing it with a loading skeleton must not discard its document.
// FileNode serialization and the real comment save path have their own integration tests.
jest.mock('../Comment', () => {
  const React = require('react');
  return ({ comment, recordRef }) => {
    const [draft, setDraft] = React.useState('');
    return comment ? (
      <div>{comment.text}</div>
    ) : (
      <div>
        <input aria-label="Draft with attachment" value={draft} onChange={e => setDraft(e.target.value)} />
        <output aria-label="Draft record">{recordRef}</output>
      </div>
    );
  };
});

const A = 'emodel/contract@a';
const B = 'emodel/contract@b';
const draft = 'Unsaved text + attached 9.mp4';
const navigate = record => {
  window.history.replaceState({}, '', `/v2/dashboard?recordRef=${record}`);
  document.dispatchEvent(new Event(Events.CHANGE_URL_LINK_EVENT));
};
const setup = () => {
  navigate(A);
  const store = createStore(
    combineReducers({
      comments: commentsReducer,
      view: () => ({ isMobile: true }),
      user: () => ({ userName: 'author' })
    })
  );
  const actions = [];
  const dispatch = store.dispatch;
  store.dispatch = action => {
    actions.push(action);
    return dispatch(action);
  };
  const result = render(
    <Provider store={store}>
      <section aria-label="Tab A">
        <Comments id="a" record={A} />
      </section>
      <section aria-label="Tab B">
        <Comments id="b" record={B} />
      </section>
    </Provider>
  );
  const a = within(screen.getByRole('region', { name: 'Tab A' }));
  fireEvent.click(a.getByText('Add comment'));
  fireEvent.change(a.getByLabelText('Draft with attachment'), { target: { value: draft } });
  return { ...result, store, actions, a };
};

describe('Comments in cached ECOS tabs', () => {
  it('keeps the draft and record binding while another tab loads and after returning', () => {
    const { store, a } = setup();
    const editor = a.getByLabelText('Draft with attachment');
    act(() => {
      navigate(B);
      store.dispatch(fetchStart(B));
    });
    expect(a.getByLabelText('Draft with attachment')).toBe(editor);
    expect(editor).toHaveValue(draft);
    expect(a.getByLabelText('Draft record')).toHaveTextContent(A);
    act(() => {
      store.dispatch(
        setComments({ recordRef: B, comments: [{ id: 'b1', text: 'B comment', dateCreate: '2026-09-11T00:00:00Z' }], totalCount: 1 })
      );
      navigate(A);
    });
    expect(a.getByLabelText('Draft with attachment')).toBe(editor);
    expect(editor).toHaveValue(draft);
    expect(a.queryByText('B comment')).toBeNull();
  });

  it('keeps a new draft mounted while its empty comment list is refreshed', () => {
    const { store, a } = setup();
    const editor = a.getByLabelText('Draft with attachment');
    act(() => store.dispatch(fetchStart(A)));
    expect(a.getByLabelText('Draft with attachment')).toBe(editor);
    act(() => store.dispatch(fetchEnd(A)));
    expect(editor).toHaveValue(draft);
  });

  it('unsubscribes from navigation when the widget unmounts', () => {
    const { unmount, actions } = setup();
    unmount();
    actions.length = 0;
    act(() => navigate(A));
    expect(actions).toEqual([]);
  });
});
