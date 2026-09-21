import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';

import Comments from '../Comments';

import { fetchEnd, fetchStart, getComments, setComments, updateComments } from '@/actions/comments';
import commentsReducer from '@/reducers/comments';
import { Events } from '@/services/PageService';

// The knowledge-base tree (and every other in-page navigation) rewrites the URL of the current tab in
// place through `changeUrlLink(link, { updateUrl: true })`. Nothing re-renders the dashboard layout
// for it, so a widget keeps the `record` prop it was mounted with (COREDEV-538). The widget has to
// follow the rewrite itself — but only a rewrite of its own, visible tab: cached tabs keep their
// widgets mounted, and those must stay bound to their own record.

// getRecordRef intentionally returns an empty string under NODE_ENV=test; use browser semantics here.
jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  getRecordRef: (url = global.window.location.href) => new URL(url, 'http://localhost').searchParams.get('recordRef') || ''
}));
jest.mock('@/services/PageService', () => ({ Events: { CHANGE_URL_LINK_EVENT: 'change-test-tab' } }));
jest.mock('@/services/pageTabs/PageTabList', () => ({
  __esModule: true,
  default: { isActiveTab: tabId => tabId === 'visible-tab' }
}));
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
jest.mock('../Comment', () => {
  const React = require('react');
  return ({ comment, recordRef }) => (comment ? <div>{comment.text}</div> : <output aria-label="Draft record">{recordRef}</output>);
});

const ROOT = 'emodel/wiki@KB$ROOT';
const ARTICLE = 'emodel/wiki@article-1';
const comment = (id, text) => ({ id, text, dateCreate: '2026-09-18T00:00:00Z' });

const changeUrl = (link, params = {}) => {
  const event = new Event(Events.CHANGE_URL_LINK_EVENT);
  event.params = { link, ...params };
  document.dispatchEvent(event);
};
// The customEvent saga listens first and has already replaced the browser URL by the time widgets see the event.
const rewriteOwnTab = recordRef => {
  const link = `/v2/dashboard?ws=KB&recordRef=${recordRef}`;
  window.history.replaceState({}, '', link);
  changeUrl(link, { updateUrl: true });
};

const setup = ({ tabId = 'visible-tab' } = {}) => {
  window.history.replaceState({}, '', `/v2/dashboard?ws=KB&recordRef=${ROOT}`);
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
  store.dispatch(setComments({ recordRef: ROOT, comments: [comment('r1', 'Root comment')], totalCount: 1 }));
  const result = render(
    <Provider store={store}>
      <Comments id="kb-comments" record={ROOT} tabId={tabId} />
    </Provider>
  );
  actions.length = 0;
  return { ...result, store, actions };
};
const fetchesOf = actions => actions.filter(a => a.type === getComments().type).map(a => a.payload);

describe('Comments widget follows the record of its own tab', () => {
  it('reloads for the record the tab was rewritten to and binds the editor to it', () => {
    const { store, actions } = setup();
    expect(screen.getByText('Root comment')).toBeInTheDocument();

    act(() => rewriteOwnTab(ARTICLE));

    expect(fetchesOf(actions)).toEqual([ARTICLE]);
    expect(screen.queryByText('Root comment')).toBeNull();

    act(() => {
      store.dispatch(setComments({ recordRef: ARTICLE, comments: [comment('a1', 'Article comment')], totalCount: 1 }));
    });
    expect(screen.getByText('Article comment')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add comment'));
    expect(screen.getByLabelText('Draft record')).toHaveTextContent(ARTICLE);
  });

  it('does not refetch when the rewrite keeps the same record', () => {
    const { actions } = setup();
    act(() => rewriteOwnTab(ROOT));
    expect(fetchesOf(actions)).toEqual([]);
    expect(screen.getByText('Root comment')).toBeInTheDocument();
  });

  it('does not re-check the list of the new record while its first load is still in flight', () => {
    // The dashboard answers every rewrite with a rewrite of its own for the same link; that must not
    // pile a second request on top of the load the remount has just started.
    const { store, actions } = setup();
    act(() => rewriteOwnTab(ARTICLE));
    expect(fetchesOf(actions)).toEqual([ARTICLE]);
    act(() => store.dispatch(fetchStart(ARTICLE)));
    actions.length = 0;

    act(() => rewriteOwnTab(ARTICLE));
    expect(actions.map(a => a.type)).toEqual([]);

    act(() => store.dispatch(fetchEnd(ARTICLE)));
    actions.length = 0;
    act(() => rewriteOwnTab(ARTICLE));
    expect(actions.map(a => a.type)).toEqual([updateComments().type]);
    expect(actions[0].payload).toEqual({ record: ARTICLE, prevComments: [] });
  });

  it('ignores a rewrite of the visible tab while it lives in a hidden cached tab', () => {
    const { actions } = setup({ tabId: 'hidden-tab' });
    act(() => rewriteOwnTab(ARTICLE));
    expect(fetchesOf(actions)).toEqual([]);
    expect(screen.getByText('Root comment')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add comment'));
    expect(screen.getByLabelText('Draft record')).toHaveTextContent(ROOT);
  });

  it('ignores navigation that opens or replaces a tab instead of rewriting this one', () => {
    const { actions } = setup();
    act(() => changeUrl(`/v2/dashboard?ws=KB&recordRef=${ARTICLE}`));
    act(() => changeUrl(`/v2/dashboard?ws=KB&recordRef=${ARTICLE}`, { openNewTab: true }));
    expect(fetchesOf(actions)).toEqual([]);
    expect(screen.getByText('Root comment')).toBeInTheDocument();
  });

  it('ignores a rewrite that carries no record', () => {
    const { actions } = setup();
    act(() => changeUrl('/v2/journals?ws=KB&journalId=articles', { updateUrl: true }));
    expect(fetchesOf(actions)).toEqual([]);
    expect(screen.getByText('Root comment')).toBeInTheDocument();
  });

  it('stops following the URL after unmount', () => {
    const { unmount, actions } = setup();
    unmount();
    actions.length = 0;
    act(() => rewriteOwnTab(ARTICLE));
    expect(actions).toEqual([]);
  });
});
