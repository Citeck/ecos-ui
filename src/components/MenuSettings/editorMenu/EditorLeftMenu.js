import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { ConfigTypes } from '../../../constants/menu';
import { addJournalMenuItems, setLastAddedLeftItems, setLeftMenuItems } from '../../../actions/menuSettings';
import BaseEditorMenu from './BaseEditorMenu';

class EditorLeftMenu extends BaseEditorMenu {
  configType = ConfigTypes.LEFT;
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.leftItems', []),
  fontIcons: get(state, 'menuSettings.fontIcons', []),
  lastAddedItems: get(state, 'menuSettings.lastAddedLeftItems', [])
});

const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setLeftMenuItems(items)),
  setLastAddedItems: items => dispatch(setLastAddedLeftItems(items)),
  addJournalMenuItems: data => dispatch(addJournalMenuItems(data))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorLeftMenu);
