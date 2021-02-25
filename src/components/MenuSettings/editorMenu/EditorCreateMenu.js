import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { setCreateMenuItems, setLastAddedCreateItems } from '../../../actions/menuSettings';
import { ConfigTypes } from '../../../constants/menu';
import BaseEditorMenu from './BaseEditorMenu';

class EditorCreateMenu extends BaseEditorMenu {
  type = ConfigTypes.CREATE;
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.createItems', []),
  fontIcons: get(state, 'menuSettings.fontIcons', []),
  lastAddedItems: get(state, 'menuSettings.lastAddedCreateItems', []),
  availableSections: get(state, 'menuSettings.availableSections', [])
});

const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setCreateMenuItems(items)),
  setLastAddedItems: items => dispatch(setLastAddedCreateItems(items))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorCreateMenu);
