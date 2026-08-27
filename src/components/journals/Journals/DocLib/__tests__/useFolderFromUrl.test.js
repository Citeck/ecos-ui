import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';

import { openFolder, setFolderId } from '@/actions/docLib';
import { setUrl } from '@/actions/journals';
import { JOURNAL_VIEW_MODE } from '@/components/journals/Journals/constants';
import { useFolderFromUrl } from '@/components/journals/Journals/DocLib/hooks/useFolderFromUrl';

const STATE_ID = '[page-tab-1]-[news-journal]-[ws]';
const ROOT = 'emodel/doclib@news$';
const FOLDER_A = 'emodel/doclib@news$emodel/doclib-directory@a';
const FOLDER_B = 'emodel/doclib@news$emodel/doclib-directory@b';

const docLibUrl = folderId => ({
  journalId: 'news-journal',
  viewMode: JOURNAL_VIEW_MODE.DOC_LIB,
  ...(folderId ? { folderId } : {})
});

/**
 * A tiny real store: the hook must react to `setUrl` (Journals refreshes `journals.url` whenever the
 * page tab gets a new link) and must NOT react to its own folder change followed by the URL catching up.
 */
const makeStore = ({ url, folderId, rootId = ROOT }) => {
  const dispatched = [];
  const recorder = () => next => action => {
    dispatched.push(action);
    return next(action);
  };
  const reducer = (state, action) => {
    if (action.type === setUrl.toString()) {
      return { ...state, journals: { [STATE_ID]: { ...state.journals[STATE_ID], url: action.payload._args } } };
    }
    if (action.type === setFolderId.toString()) {
      return { ...state, documentLibrary: { [STATE_ID]: { ...state.documentLibrary[STATE_ID], folderId: action.payload._args } } };
    }
    return state;
  };
  const store = createStore(
    reducer,
    { journals: { [STATE_ID]: { url } }, documentLibrary: { [STATE_ID]: { rootId, folderId } } },
    applyMiddleware(recorder)
  );

  return { store, dispatched };
};

const openFolderCalls = dispatched => dispatched.filter(a => a.type === openFolder.toString()).map(a => a.payload._args);

const renderFolderSync = (store, enabled = true) =>
  renderHook(({ on }) => useFolderFromUrl(STATE_ID, on), {
    initialProps: { on: enabled },
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
  });

describe('useFolderFromUrl', () => {
  it('opens the folder from the URL when the page tab receives a link to another folder', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_B), folderId: FOLDER_B });
    renderFolderSync(store);

    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: docLibUrl(FOLDER_A) }));
    });

    expect(openFolderCalls(dispatched)).toEqual([FOLDER_A]);
  });

  it('falls back to the root when the new link has no folderId', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_B), folderId: FOLDER_B });
    renderFolderSync(store);

    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: docLibUrl() }));
    });

    expect(openFolderCalls(dispatched)).toEqual([ROOT]);
  });

  it('does nothing while the URL already matches the opened folder', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_B), folderId: FOLDER_B });
    renderFolderSync(store);

    expect(openFolderCalls(dispatched)).toEqual([]);
  });

  it('does not ping-pong when the user opens a folder and the URL catches up afterwards', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_A), folderId: FOLDER_A });
    renderFolderSync(store);

    // sagaOpenFolder sets the folder first, the URL (and journals.url) is updated asynchronously later
    act(() => {
      store.dispatch(setFolderId({ stateId: STATE_ID, _args: FOLDER_B }));
    });
    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: docLibUrl(FOLDER_B) }));
    });

    expect(openFolderCalls(dispatched)).toEqual([]);
  });

  it('ignores links of other views (journals.url is overwritten with the dashboard params on tab switch)', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_B), folderId: FOLDER_B });
    renderFolderSync(store);

    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: { ws: 'admin$workspace' } }));
    });
    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: { journalId: 'news-journal', viewMode: JOURNAL_VIEW_MODE.TABLE } }));
    });

    expect(openFolderCalls(dispatched)).toEqual([]);
  });

  it('does nothing before the library is initialised (no current folder yet)', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_A), folderId: null, rootId: null });
    renderFolderSync(store);

    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: docLibUrl(FOLDER_B) }));
    });

    expect(openFolderCalls(dispatched)).toEqual([]);
  });

  it('does nothing while disabled and catches up once enabled', () => {
    const { store, dispatched } = makeStore({ url: docLibUrl(FOLDER_B), folderId: FOLDER_B });
    const { rerender } = renderFolderSync(store, false);

    act(() => {
      store.dispatch(setUrl({ stateId: STATE_ID, _args: docLibUrl(FOLDER_A) }));
    });
    expect(openFolderCalls(dispatched)).toEqual([]);

    rerender({ on: true });
    expect(openFolderCalls(dispatched)).toEqual([FOLDER_A]);
  });
});
