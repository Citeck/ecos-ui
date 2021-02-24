import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { ConfigTypes } from '../../../constants/menu';
import { addJournalMenuItems, setLastAddedLeftItems, setLeftMenuItems } from '../../../actions/menuSettings';
import BaseEditorMenu from './BaseEditorMenu';

class EditorCreateMenu extends BaseEditorMenu {
  type = ConfigTypes.CREATE;
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.createItems', []),
  fontIcons: get(state, 'menuSettings.fontIcons', []),
  lastAddedItems: get(state, 'menuSettings.lastAddedCreateItems', [])
});

const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setLeftMenuItems(items)),
  setLastAddedItems: items => dispatch(setLastAddedLeftItems(items)),
  addJournalMenuItems: data => dispatch(addJournalMenuItems(data))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorCreateMenu);
