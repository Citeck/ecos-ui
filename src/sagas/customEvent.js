import * as queryString from 'query-string';
import { eventChannel } from 'redux-saga';
import { put, take, takeLatest } from 'redux-saga/effects';

import { handleEventChangeUrl, registerEventListeners } from '../actions/customEvent';
import { setTab, updateTab } from '../actions/pageTabs';
import { decodeLink, pushHistoryLink, replaceHistoryLink } from '../helpers/urls';
import PageService, { Events } from '../services/PageService';

function* _registerEventListeners() {
  yield registerEventListenerChangeUrlLink();
}

function* registerEventListenerChangeUrlLink() {
  const channel = eventChannel(emitter => {
    const _emitter = emitter;
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, _emitter);

    return () => {
      document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, _emitter);
    };
  });

  try {
    while (true) {
      const event = yield take(channel);
      yield put(handleEventChangeUrl(event));
    }
  } finally {
    channel.close();
  }
}

function* _handleChangeUrl({ api }, { payload: event }) {
  const { reopen, closeActiveTab, updates, pushHistory, ...data } = PageService.parseEvent({ event }) || {};

  if (updates) {
    const { link } = updates;

    if (link) {
      if (pushHistory) {
        const { url, query } = queryString.parseUrl(link);

        pushHistoryLink(window, {
          pathname: url,
          search: decodeLink(queryString.stringify(query))
        });
      } else {
        replaceHistoryLink(window, link);
      }
    }
    yield put(updateTab({ updates }));
    return;
  }

  yield put(setTab({ data, params: { reopen, closeActiveTab } }));
}

function* customEvent(ea) {
  yield takeLatest(registerEventListeners().type, _registerEventListeners, ea);
  yield takeLatest(handleEventChangeUrl().type, _handleChangeUrl, ea);
}

export default customEvent;
