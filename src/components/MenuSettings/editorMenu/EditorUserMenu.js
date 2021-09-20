import { connect } from 'react-redux';
import get from 'lodash/get';

import BaseEditorMenu from './BaseEditorMenu';
import { ConfigTypes, MenuSettings } from '../../../constants/menu';
import { setUserMenuItems } from '../../../actions/menuSettings';

class EditorUserMenu extends BaseEditorMenu {
  configType = ConfigTypes.USER;

  getCreateOptions(item, level) {
    const { items } = this.props;
    const options = super.getCreateOptions(item, level);
    const types = (items || []).map(item => item.type);

    return options.filter(item => item.key === MenuSettings.ItemTypes.ARBITRARY || !types.includes(item.key));
  }

  renderToggleOpenButton = () => null;
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.userMenuItems', []),
  fontIcons: get(state, 'menuSettings.fontIcons', [])
});
const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setUserMenuItems(items))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorUserMenu);
