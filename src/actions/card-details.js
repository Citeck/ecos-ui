// import NodeHeader from '../cardlets/js/citeck/modules/cardlets/node-header/node-header';

export const SET_PAGE_ARGS = 'SET_PAGE_ARGS';
export const SET_CARD_MODE = 'SET_CARD_MODE';

export const REQUEST_CARDLETS = 'REQUEST_CARDLETS';
export const RECEIVE_CARDLETS = 'RECEIVE_CARDLETS';

export const REQUEST_CONTROL = 'REQUEST_CONTROLLER';
export const RECEIVE_CONTROL = 'RECEIVE_CONTROLLER';

export const REQUEST_NODE_INFO = 'REQUEST_NODE_BASE_INFO';
export const RECEIVE_NODE_INFO = 'RECEIVE_NODE_BASE_INFO';

export const REQUEST_CARDLET_DATA = 'REQUEST_CARDLET_DATA';
export const RECEIVE_CARDLET_DATA = 'RECEIVE_CARDLET_DATA';
export const RECEIVE_ERR_CARDLET_DATA = 'RECEIVE_ERR_CARDLET_DATA';

export const CARD_MODE_LOADED = 'CARD_MODE_LOADED';

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
    const controlUrl = '../cardlets/' + cardletProps.control.url;

    let state = getState();
    let control = (state.cardDetails.controls || {})[controlUrl];

    if (!control) {
      dispatch({
        type: REQUEST_CONTROL,
        control: cardletProps.control
      });

      // require([controlUrl], function(data) {
      //     let controlClass = data.default;
      //     dispatch({
      //         type: RECEIVE_CONTROL,
      //         controlClass,
      //         control: cardletProps.control
      //     });
      // });

      // console.log('controlUrl', controlUrl);
      let thenFunc = data => {
        let controlClass = data.default;
        dispatch({
          type: RECEIVE_CONTROL,
          controlClass,
          control: cardletProps.control
        });
      };

      switch (controlUrl) {
        case '../cardlets/js/citeck/modules/cardlets/node-header/node-header':
          import('../cardlets/js/citeck/modules/cardlets/node-header/node-header').then(thenFunc);
          break;
        case '../cardlets/js/citeck/modules/cardlets/document-children/document-children':
          import('../cardlets/js/citeck/modules/cardlets/document-children/document-children').then(thenFunc);
          break;
        default:
          import(controlUrl).then(thenFunc);
      }

      state = getState();
      control = state.cardDetails.controls[controlUrl];
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
      // require([controlUrl], function (data) {
      //     fetchData(data.default);
      // });

      // console.log('controlUrl2', controlUrl);
      // import(controlUrl).then(data => {
      //   fetchData(data.default);
      // });
      //
      let thenFunc = data => {
        fetchData(data.default);
      };

      switch (controlUrl) {
        case '../cardlets/js/citeck/modules/cardlets/node-header/node-header':
          import('../cardlets/js/citeck/modules/cardlets/node-header/node-header').then(thenFunc);
          break;
        default:
          import(controlUrl).then(thenFunc);
      }
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
