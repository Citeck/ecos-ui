import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { deepClone, t } from '../../helpers/util';
import { treeGetPathItem, treeMoveItem } from '../../helpers/arrayOfObjects';
import { MenuSettings } from '../../constants/menu';
import MenuService from '../../services/menu';
import { Tree } from '../../components/common';
import { Btn } from '../../components/common/btns';
import { Dropdown, SelectJournal } from '../../components/common/form';
import dialogManager from '../../components/common/dialogs/Manager';
import EditorItemModal from './EditorItemModal';

import './style.scss';

const Labels = {
  TITLE: 'menu-settings.editor-items.title',
  SUBTITLE: 'menu-settings.editor-items.subtitle',
  BTN_ADD: 'menu-settings.editor-items.dropdown.add',
  TIP_NO_ITEMS: 'menu-settings.editor-items.none',
  TIP_DRAG_HERE: 'menu-settings.editor-items.drag-item-here',
  BTN_EXPAND_ALL: 'menu-settings.editor-items.btn.expand-all',
  BTN_COLLAPSE_ALL: 'menu-settings.editor-items.btn.collapse-all'
};

class EditorItems extends React.Component {
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
    items: [],
    openAllMenuItems: false
  };

  static getDerivedStateFromProps({ items = [] }, state) {
    let newState = null;

    if (!!items.length && !state.items.length) {
      newState = { ...newState, items };
    }

    return newState;
  }

  toggleOpenAMI = () => {
    this.setState(({ openAllMenuItems }) => ({ openAllMenuItems: !openAllMenuItems }));
  };

  handleSelectOption = (a, b, c) => {
    console.log(a, b, c);
  };

  handleOpenSettings = (a, b, c) => {
    console.log(a, b, c);
  };

  handleChooseOption = (type, item) => {
    if ([MenuSettings.OptionKeys.JOURNAL, MenuSettings.OptionKeys.LINK_CREATE_CASE].includes(type.key)) {
      //todo
      this.setState({
        createItemInfo: {
          type,
          item,
          several: true,
          journalId:
            type.key === MenuSettings.OptionKeys.JOURNAL
              ? 'workspace%3A%2F%2FSpacesStore%2F3700b0df-b8b6-440a-a399-dd30f127e404'
              : 'workspace%3A%2F%2FSpacesStore%2F564bbe41-c456-44b3-8ab2-1b3d82e15aaa'
        }
      });
    } else {
      this.setState({ createItemInfo: { type, item } });
    }
  };

  handleActionItem = ({ action, item }) => {
    if (action === MenuSettings.ActionTypes.DELETE) {
      dialogManager.showRemoveDialog({
        title: '',
        text: t('menu-settings.message.delete-item', { name: item.name }),
        className: 'ecos-modal_width-xs',
        onDelete: () => {
          console.log('onDelete');
        },
        onCancel: () => {
          console.log('onCancel');
        }
      });
    }

    if (action === MenuSettings.ActionTypes.EDIT) {
      this.handleChooseOption(this.props.createOptions.find(o => o.key === item.type), item);
    }

    const items = MenuService.processAction({ action, id: item.id, items: this.state.items });
    this.setState({ items });
  };

  handleClickIcon = item => {
    console.log('handleClickIcon', item);
  };

  onDragEnd = (fromId, toId) => {
    const items = treeMoveItem({ fromId, toId, original: this.state.items, key: 'dndIdx' });
    this.setState({ items });
  };

  renderEditorItem = () => {
    const { createItemInfo } = this.state;

    if (!createItemInfo) {
      return null;
    }

    const handleHideModal = () => {
      this.setState({ createItemInfo: null });
    };

    const handleSave = newItem => {
      const items = deepClone(this.state.items || []);
      const path = treeGetPathItem({ items, value: get(createItemInfo, 'item.dndIdx'), key: 'dndIdx' });

      if (path) {
        get(items, path, {}).items.push(newItem);
      } else {
        items.push(newItem);
      }

      this.setState({ createItemInfo: null, items });
    };

    if (createItemInfo.several) {
      return (
        <SelectJournal
          journalId={createItemInfo.journalId}
          isSelectModalOpen
          multiple
          renderView={() => null}
          onChange={handleSave}
          onCancel={handleHideModal}
        />
      );
    }

    return <EditorItemModal type={createItemInfo.type} onClose={handleHideModal} onSave={handleSave} />;
  };

  renderButtonAddSection = ({ item, level, isOpen }) => {
    if (!item || (level < 3 && item.expandable && item.selected)) {
      const createOptions = MenuService.getAvailableCreateOptions(this.props.createOptions, item);

      return createOptions && createOptions.length ? (
        <Dropdown
          source={createOptions}
          valueField={'id'}
          titleField={'label'}
          onChange={type => this.handleChooseOption(type, item)}
          className=""
          menuClassName="ecos-menu-settings-editor-items__menu-options"
          isStatic
          controlLabel={t(Labels.BTN_ADD)}
          controlIcon="icon-plus"
          controlClassName={'ecos-btn_hover_light-blue2 ecos-btn_sq_sm'}
        />
      ) : null;
    }

    return null;
  };

  render() {
    const { openAllMenuItems } = this.state;
    const items = MenuService.setActiveActions(deepClone(this.state.items));

    return (
      <div className="ecos-menu-settings-editor-items">
        <div className="ecos-menu-settings__title">{t(Labels.TITLE)}</div>
        <div className="ecos-menu-settings-editor-items__header">
          <div className="ecos-menu-settings__subtitle ecos-menu-settings-editor-items__subtitle">{t(Labels.SUBTITLE)}</div>
          {this.renderButtonAddSection({})}
          <div className="ecos--flex-space" />
          <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={this.toggleOpenAMI}>
            {t(openAllMenuItems ? Labels.BTN_COLLAPSE_ALL : Labels.BTN_EXPAND_ALL)}
          </Btn>
        </div>
        <div className="ecos-menu-settings-editor-items__tree-field">
          <Tree
            data={items}
            prefixClassName="ecos-menu-settings-editor-items"
            openAll={openAllMenuItems}
            onClickAction={this.handleActionItem}
            onDragEnd={this.onDragEnd}
            onClickIcon={this.handleClickIcon}
            renderExtraItemComponents={this.renderButtonAddSection}
            draggable={false}
            moveInLevel
            moveInParent
          />
        </div>
        {this.renderEditorItem()}
      </div>
    );
  }
}

export default EditorItems;
