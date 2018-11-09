import { handleActions } from 'redux-actions';
import { setCreateCaseWidgetItems, setCreateCaseWidgetIsCascade } from '../actions/header';

const initialState = {
  createCaseWidget: {
    isCascade: false,
    items: []
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [setCreateCaseWidgetItems]: (state, action) => {
      return {
        ...state,
        createCaseWidget: {
          ...state.createCaseWidget,
          items: action.payload
        }
      };
    },
    [setCreateCaseWidgetIsCascade]: (state, action) => {
      return {
        ...state,
        createCaseWidget: {
          ...state.createCaseWidget,
          isCascade: action.payload
        }
      };
    }
  },
  initialState
);
