import { connect } from 'react-redux';
import get from 'lodash/get';

import BaseEditorMenu from './BaseEditorMenu';
import { ConfigTypes } from '../../../constants/menu';

class EditorUserMenu extends BaseEditorMenu {
  configType = ConfigTypes.USER;
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.user.createItems', []),
  fontIcons: get(state, 'menuSettings.fontIcons', []),
  lastAddedItems: get(state, 'menuSettings.user.lastAddedCreateItems', []),
  availableSections: get(state, 'menuSettings.user.availableSections', [])
});
const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorUserMenu);
