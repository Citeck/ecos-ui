import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../helpers/util';
import { treeMoveItem } from '../../helpers/arrayOfObjects';
import MenuService from '../../services/menu';
import { Tree } from '../../components/common';
import { IcoBtn } from '../../components/common/btns';
import { Dropdown } from '../../components/common/form';
import dialogManager from '../../components/common/dialogs/Manager';

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

  state = {
    items: []
  };

  static getDerivedStateFromProps({ items = [] }, state) {
    let newState = null;

    if (items.length !== state.items.length) {
      newState = { ...newState, items };
    }

    return newState;
  }

  handleSelectOption = (a, b, c) => {
    console.log(a, b, c);
  };

  handleOpenSettings = (a, b, c) => {
    console.log(a, b, c);
  };

  handleChooseOption = (a, b, c) => {
    console.log(a, b, c);
  };

  handleActionItem = ({ action, id }) => {
    if (action === MenuService.ActionTypes.DELETE) {
      dialogManager.showRemoveDialog({
        title: '',
        text: `Удалить раздел “${id}”?`,
        className: 'ecos-modal_width-xs',
        onDelete: () => {
          console.log('onDelete');
        },
        onCancel: () => {
          console.log('onCancel');
        }
      });
    }

    const items = MenuService.processAction({ action, id, items: this.state.items });
    this.setState({ items });
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

  onDragEnd = (fromId, toId) => {
    const items = treeMoveItem({ fromId, toId, original: this.state.items, key: 'dndIdx' });
    this.setState({ items });
  };

  render() {
    const items = MenuService.setActiveActions(this.state.items);

    // items.forEach(item => {
    //   if (item.expandable && item.selected) {
    //     item.customComponents = [this.renderButtonAddSection({ onChange: this.handleChooseOption, item })];
    //   }
    // });

    return (
      <div className="ecos-menu-settings-editor-items">
        <div className="ecos-menu-settings__title">{t(Labels.TITLE)}</div>
        <div className="ecos-menu-settings-editor-items__header">
          <div className="ecos-menu-settings__subtitle ecos-menu-settings-editor-items__subtitle">{t(Labels.SUBTITLE)}</div>
          {this.renderButtonAddSection({ onChange: this.handleChooseOption })}
        </div>
        <div className="ecos-menu-settings-editor-items__tree-field">
          <Tree
            data={items}
            prefixClassName="ecos-menu-settings-editor-items"
            openAll
            draggable
            onClickActionItem={this.handleActionItem}
            onDragEnd={this.onDragEnd}
          />
        </div>
      </div>
    );
  }
}

export default EditorLeft;
