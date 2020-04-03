import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../helpers/util';
import MenuService from '../../services/menu';
import { Tree } from '../../components/common';
import { IcoBtn } from '../../components/common/btns';
import { Dropdown } from '../../components/common/form';

import './style.scss';

const Labels = {
  TITLE: 'menu-settings.editor-items.title',
  SUBTITLE: 'menu-settings.editor-items.subtitle',
  BTN_ADD: 'menu-settings.editor-items.btn.add',
  TIP_NO_ITEMS: 'menu-settings.editor-items.none',
  TIP_DRAG_HERE: 'menu-settings.editor-items.drag-item-here'
};

class EditorLeft extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    items: PropTypes.array,
    createOptions: PropTypes.array
  };

  static defaultProps = {
    className: '',
    items: [],
    createOptions: []
  };

  state = {};

  handleSelectOption = (a, b, c) => {
    console.log(a, b, c);
  };

  handleOpenSettings = (a, b, c) => {
    console.log(a, b, c);
  };

  handleChooseOption = (a, b, c) => {
    console.log(a, b, c);
  };

  renderButtonAddSection({ onChange, item }) {
    const createOptions = MenuService.getAvailableCreateOptions(this.props.createOptions, item);

    return (
      <Dropdown
        source={createOptions}
        valueField={'id'}
        titleField={'label'}
        onChange={onChange}
        isButton
        className=""
        menuClassName="ecos-menu-settings-editor-items__menu-options"
      >
        <IcoBtn icon="icon-plus" className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm">
          {t(Labels.BTN_ADD)}
        </IcoBtn>
      </Dropdown>
    );
  }

  render() {
    const { items } = this.props;

    items.forEach(item => {
      if (item.expandable && item.selected) {
        item.customComponents = [this.renderButtonAddSection({ onChange: this.handleChooseOption, item })];
      }
    });

    return (
      <div className="ecos-menu-settings-editor-items">
        <div className="ecos-menu-settings__title">{t(Labels.TITLE)}</div>
        <div className="ecos-menu-settings-editor-items__header">
          <div className="ecos-menu-settings__subtitle ecos-menu-settings-editor-items__subtitle">{t(Labels.SUBTITLE)}</div>
          {this.renderButtonAddSection({ onChange: this.handleChooseOption })}
        </div>
        <div className="ecos-menu-settings-editor-items__tree-field">
          <Tree data={items} draggable classNameItem="ecos-menu-settings-editor-items__tree-item" />
        </div>
      </div>
    );
  }
}

export default EditorLeft;
