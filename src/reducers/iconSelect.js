import { handleActions } from 'redux-actions';
import { deleteCustomIcon, getCustomIcons, setCustomIcons, setFontIcons, setLoading, uploadCustomIcon } from '../actions/iconSelect';

const initialState = {
  customIcons: [],
  isLoading: false
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [getCustomIcons]: startLoading,
    [deleteCustomIcon]: startLoading,
    [uploadCustomIcon]: startLoading,

    [setCustomIcons]: (state, { payload }) => ({
      ...state,
      customIcons: payload,
      isLoading: false
    }),
    [setFontIcons]: (state, { payload }) => ({
      ...state,
      fontIcons: payload
    }),
    [setLoading]: (state, { payload }) => ({
      ...state,
      isLoading: payload
    })
  },
  initialState
);
