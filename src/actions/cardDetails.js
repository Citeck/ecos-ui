const prefix = 'cardDetails/';

export const SET_PAGE_ARGS = prefix + 'SET_PAGE_ARGS';
export const SET_CARD_MODE = prefix + 'SET_CARD_MODE';

export const REQUEST_CARDLETS = prefix + 'REQUEST_CARDLETS';
export const RECEIVE_CARDLETS = prefix + 'RECEIVE_CARDLETS';

export const REQUEST_CONTROL = prefix + 'REQUEST_CONTROLLER';
export const RECEIVE_CONTROL = prefix + 'RECEIVE_CONTROLLER';

export const REQUEST_NODE_INFO = prefix + 'REQUEST_NODE_BASE_INFO';
export const RECEIVE_NODE_INFO = prefix + 'RECEIVE_NODE_BASE_INFO';

export const REQUEST_CARDLET_DATA = prefix + 'REQUEST_CARDLET_DATA';
export const RECEIVE_CARDLET_DATA = prefix + 'RECEIVE_CARDLET_DATA';
export const RECEIVE_ERR_CARDLET_DATA = prefix + 'RECEIVE_ERR_CARDLET_DATA';

export const CARD_MODE_LOADED = prefix + 'CARD_MODE_LOADED';

const YAHOO = window.YAHOO;

export function setCardMode(cardMode, registerReducers) {
  return (dispatch, getState) => {
    let state = getState();

    if (state.cardDetails.currentCardMode === cardMode) {
      return;
    }

    dispatch({
      type: SET_CARD_MODE,
      cardMode: cardMode
    });
  };
}

export function setPageArgs(pageArgs) {
  return {
    type: SET_PAGE_ARGS,
    pageArgs: pageArgs
  };
}

export function fetchNodeInfo(nodeRef, infoType = 'full') {
  return (dispatch, getState) => {
    let getCurrentInfo = function() {
      return (getState().nodes || {})[nodeRef] || {};
    };

    let info = getCurrentInfo();

    if (info.isFetching) {
      return Promise.resolve();
    }

    dispatch({
      type: REQUEST_NODE_INFO,
      nodeRef: nodeRef
    });

    return fetch('/share/proxy/alfresco/citeck/node/info?nodeRef=' + nodeRef + '&infoType=' + infoType, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(json => {
        dispatch({
          type: RECEIVE_NODE_INFO,
          nodeRef: nodeRef,
          data: json
        });

        if (json.pendingUpdate) {
          setTimeout(() => {
            //check only pending update
            dispatch(fetchNodeInfo(nodeRef, 'pendingUpdate')).then(() => {
              info = getCurrentInfo();
              if (!info.pendingUpdate) {
                // 'pending update' is false. load full node info
                dispatch(fetchNodeInfo(nodeRef)).then(() => {
                  info = getCurrentInfo();
                  // if node is not pending update fetch cardlets and update existing
                  if (!info.pendingUpdate) {
                    dispatch(fetchCardlets(nodeRef));
                    YAHOO.Bubbling.fire('metadataRefresh');
                  }
                });
              }
            });
          }, 2000);
        }
      });
  };
}

export function fetchCardletData(cardletProps) {
  return (dispatch, getState) => {
    let state = getState();
    let control = (state.cardDetails.controls || {})[cardletProps.control.url];

    if (!control) {
      dispatch({
        type: REQUEST_CONTROL,
        control: cardletProps.control
      });

      // TODO
      const controlUrl = `/share/res/${cardletProps.control.url}.js?3.5.0.18.11.12.11.59`;
      window.require([controlUrl], function(data) {
        let controlClass = data.default;
        dispatch({
          type: RECEIVE_CONTROL,
          controlClass,
          control: cardletProps.control
        });
      });

      state = getState();
      control = state.cardDetails.controls[cardletProps.control.url];
    }

    let fetchData = controlClass => {
      let fetchKey = controlClass.prototype.constructor.getFetchKey(cardletProps);
      state = getState();
      let cardletState = (state.cardDetails.cardletsState || {})[cardletProps.id] || {};

      if (fetchKey != null) {
        if (fetchKey !== cardletState.fetchKey) {
          dispatch({
            type: REQUEST_CARDLET_DATA,
            cardletProps,
            fetchKey
          });

          controlClass.prototype.constructor.fetchData(
            cardletProps,
            data => {
              dispatch({
                type: RECEIVE_CARDLET_DATA,
                fetchKey,
                cardletProps,
                data
              });
            },
            error => {
              console.error(error);
              dispatch({
                type: RECEIVE_ERR_CARDLET_DATA,
                fetchKey,
                cardletProps,
                error
              });
            }
          );
        }
      }
    };

    if (control.isFetching) {
      // TODO
      const controlUrl = `/share/res/${cardletProps.control.url}.js?3.5.0.18.11.12.11.59`;
      window.require([controlUrl], function(data) {
        fetchData(data.default);
      });
    } else {
      fetchData(control.controlClass);
    }
  };
}

export function fetchCardlets(nodeRef) {
  return dispatch => {
    dispatch({
      type: REQUEST_CARDLETS,
      nodeRef: nodeRef
    });

    return fetch('/share/proxy/alfresco/citeck/card/cardlets?mode=all&nodeRef=' + nodeRef, {
      credentials: 'include'
    })
      .then(response => {
        return response.json();
      })
      .then(json => {
        dispatch({
          type: RECEIVE_CARDLETS,
          receivedAt: Date.now(),
          data: json
        });
      });
  };
}
