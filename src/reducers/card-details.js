import {
  SET_CARD_MODE,
  SET_PAGE_ARGS,
  REQUEST_CARDLETS,
  RECEIVE_CARDLETS,
  REQUEST_CONTROL,
  RECEIVE_CONTROL,
  REQUEST_NODE_INFO,
  RECEIVE_NODE_INFO,
  REQUEST_CARDLET_DATA,
  RECEIVE_CARDLET_DATA,
  RECEIVE_ERR_CARDLET_DATA
} from '../actions/card-details';

let reducersStore = {
  [SET_CARD_MODE]: function(state = {}, action) {
    let visitedModes = state.visitedCardModes || {};
    return {
      ...state,
      visitedCardModes: {
        ...visitedModes,
        [action.cardMode]: true
      },
      currentCardMode: action.cardMode
    };
  },

  [SET_PAGE_ARGS]: function(state = {}, action) {
    return {
      ...state,
      pageArgs: action.pageArgs
    };
  },

  [REQUEST_CARDLETS]: function(state = {}, action) {
    let dataBefore = state.cardletsData || {};
    return {
      ...state,
      cardletsData: {
        ...dataBefore,
        isFetching: true
      }
    };
  },
  [RECEIVE_CARDLETS]: function(state = {}, action) {
    let dataBefore = state.cardletsData || {};
    return {
      ...state,
      cardletsData: {
        ...dataBefore,
        isFetching: false,
        receivedAt: action.receivedAt,
        cardlets: action.data.cardlets,
        cardModes: action.data.cardModes
      }
    };
  },
  [REQUEST_CONTROL]: function(state = {}, action) {
    let controls = state.controls || {};
    let controlUrl = '../cardlets/' + action.control.url;
    return {
      ...state,
      controls: {
        ...controls,
        [controlUrl]: {
          isFetching: true
        }
      }
    };
  },
  [RECEIVE_CONTROL]: function(state = {}, action) {
    let controls = state.controls || {};
    let controlUrl = '../cardlets/' + action.control.url;
    return {
      ...state,
      controls: {
        ...controls,
        [controlUrl]: {
          isFetching: false,
          controlClass: action.controlClass
        }
      }
    };
  },
  [REQUEST_NODE_INFO]: function(state = {}, action) {
    let nodes = state.nodes || {};
    let nodeInfo = nodes[action.nodeRef] || {};
    return {
      ...state,
      nodes: {
        ...nodes,
        [action.nodeRef]: {
          ...nodeInfo,
          isFetching: true
        }
      }
    };
  },
  [RECEIVE_NODE_INFO]: function(state = {}, action) {
    let nodes = state.nodes || {};
    let nodeInfo = nodes[action.nodeRef] || {};
    return {
      ...state,
      nodes: {
        ...nodes,
        [action.nodeRef]: {
          ...nodeInfo,
          ...action.data,
          isFetching: false
        }
      }
    };
  },
  [REQUEST_CARDLET_DATA]: function(state = {}, action) {
    let cardletsState = state.cardletsState || {};
    let cardletData = cardletsState[action.cardletProps.id] || {};
    return {
      ...state,
      cardletsState: {
        ...cardletsState,
        [action.cardletProps.id]: {
          ...cardletData,
          fetchKey: action.fetchKey,
          isFetching: true
        }
      }
    };
  },
  [RECEIVE_CARDLET_DATA]: function(state = {}, action) {
    let cardletsState = state.cardletsState || {};
    let cardletData = cardletsState[action.cardletProps.id] || {};
    return {
      ...state,
      cardletsState: {
        ...cardletsState,
        [action.cardletProps.id]: {
          ...cardletData,
          isFetching: false,
          fetchKey: action.fetchKey,
          data: action.data
        }
      },
      ...onCardletLoaded(state, action.cardletProps)
    };
  },
  [RECEIVE_ERR_CARDLET_DATA]: function(state = {}, action) {
    let cardletsState = state.cardletsState || {};
    let cardletData = cardletsState[action.cardletProps.id] || {};
    return {
      ...state,
      cardletsState: {
        ...cardletsState,
        [action.cardletProps.id]: {
          ...cardletData,
          isFetching: false,
          fetchKey: action.fetchKey,
          error: action.error
        }
      },
      ...onCardletLoaded(state, action.cardletProps)
    };
  }
};

function onCardletLoaded(state, cardlet) {
  let cardletsLoadingState = state.cardletsLoadingState || {};
  let modesLoadingState = state.modesLoadingState || {};

  if (!cardletsLoadingState[cardlet.id]) {
    cardletsLoadingState = Object.assign({}, cardletsLoadingState);
    cardletsLoadingState[cardlet.id] = true;

    if (!modesLoadingState[cardlet.cardMode]) {
      let isModeLoaded = function(modeId) {
        let cardlets = state.cardletsData.cardlets;
        for (let cardlet of cardlets) {
          if (cardlet.cardMode === modeId && cardlet.regionId !== 'node-view') {
            //todo: fix node-view loading time
            if (!cardletsLoadingState[cardlet.id]) {
              return false;
            }
          }
        }
        return true;
      };

      if (isModeLoaded(cardlet.cardMode)) {
        modesLoadingState = Object.assign({}, modesLoadingState);
        modesLoadingState[cardlet.cardMode] = true;
        modesLoadingState['any'] = true;
      }
    }
  }

  return {
    cardletsLoadingState,
    modesLoadingState
  };
}

export const rootReducer = function(state = {}, action) {
  let reducer = reducersStore[action.type];
  return reducer ? reducer(state, action) : state;
};

export const registerReducers = function(reducers) {
  for (let actionId in reducers) {
    if (reducers.hasOwnProperty(actionId)) {
      reducersStore[actionId] = reducers[actionId];
    }
  }
};
