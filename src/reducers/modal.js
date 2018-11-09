import { handleActions } from 'redux-actions';
import { showModal, hideModal } from '../actions/modal';

/*
Button list example:
buttons: [
    {
        label: 'Button label',
        onClick: () => {
            ...some actions
        },
        bsStyle: "primary", // TODO use color
        isCloseButton: false
    },
    ...other buttons
]
 */

const initialState = {
  isOpen: false,
  title: '',
  content: '',
  onCloseCallback: null,
  buttons: []
};

Object.freeze(initialState);

export default handleActions(
  {
    [showModal]: (state, action) => {
      return {
        ...state,
        isOpen: true,
        ...action.payload
      };
    },
    [hideModal]: () => {
      return initialState;
    }
  },
  initialState
);
