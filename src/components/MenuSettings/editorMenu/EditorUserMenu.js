import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { Alert } from 'reactstrap';

import BaseEditorMenu from './BaseEditorMenu';
import { ConfigTypes, DefaultUserMenu, MenuSettings } from '../../../constants/menu';
import { setUserMenuItems } from '../../../actions/menuSettings';
import { extractLabel } from '../../../helpers/util';
import { t } from '../../../helpers/export/util';

const Labels = {
  EMPTY_MESSAGE: 'menu-editor.user.empty.msg'
};

class EditorUserMenu extends BaseEditorMenu {
  configType = ConfigTypes.USER;

  getCreateOptions(item, level) {
    const { items } = this.props;
    const options = super.getCreateOptions(item, level);
    const types = (items || []).map(item => item.type);

    return options.filter(item => item.key === MenuSettings.ItemTypes.ARBITRARY || !types.includes(item.key));
  }

  renderToggleOpenButton = () => null;

  renderDescription() {
    const { items } = this.props;

    if (!isEmpty(items.filter(item => !item.hidden))) {
      return null;
    }

    return (
      <Alert color="info ws-bs">{t(Labels.EMPTY_MESSAGE, { items: DefaultUserMenu.map(i => extractLabel(i.label)).join(', ') })}</Alert>
    );
  }
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
