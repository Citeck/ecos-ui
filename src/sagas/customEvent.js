import { eventChannel } from 'redux-saga';
import { put, select, take, takeLatest } from 'redux-saga/effects';
import { replace } from 'connected-react-router';
import * as queryString from 'query-string';
import get from 'lodash/get';

import { decodeLink, pushHistoryLink, replaceHistoryLink } from '../helpers/urls';
import { isOnlyContent } from '../helpers/timesheet/util';
import PageService, { Events } from '../services/PageService';
import { setTab, updateTab } from '../actions/pageTabs';
import { handleEventChangeUrl, registerEventListeners } from '../actions/customEvent';

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

function* _handleChangeUrl({ api, logger }, { payload: event }) {
  const isShowTabs = yield select(state => get(state, 'pageTabs.isShow', false));
  const isMobile = yield select(state => get(state, 'view.isMobile', false));

  const {
    params: { link = '', rerenderPage, replaceHistory }
  } = event;

  if (!(isShowTabs && !isOnlyContent() && !isMobile) || (rerenderPage && replaceHistory)) {
    const { url, query } = queryString.parseUrl(link);

    pushHistoryLink(window, {
      pathname: url,
      search: decodeLink(queryString.stringify(query))
    });
    yield put(replace(link));
    return;
  }

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
