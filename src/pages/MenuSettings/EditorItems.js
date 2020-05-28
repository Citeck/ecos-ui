import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { extractLabel, t } from '../../helpers/util';
import { treeMoveItem } from '../../helpers/arrayOfObjects';
import { MenuSettings as ms } from '../../constants/menu';
import MenuSettingsService from '../../services/MenuSettingsService';
import { setMenuItems } from '../../actions/menuSettings';
import IconSelect from '../../components/IconSelect';
import { Tree } from '../../components/common';
import { Btn } from '../../components/common/btns';
import { Dropdown, SelectJournal } from '../../components/common/form';
import dialogManager from '../../components/common/dialogs/Manager';
import EditorItemModal from './EditorItemModal';

import './style.scss';

const Labels = {
  SUBTITLE: 'menu-settings.editor-items.subtitle',
  BTN_ADD: 'menu-settings.editor-items.dropdown.add',
  TIP_NO_ITEMS: 'menu-settings.editor-items.none',
  TIP_DRAG_HERE: 'menu-settings.editor-items.drag-item-here',
  BTN_EXPAND_ALL: 'menu-settings.editor-items.btn.expand-all',
  BTN_COLLAPSE_ALL: 'menu-settings.editor-items.btn.collapse-all'
};

class EditorItems extends React.Component {
  static propTypes = {
    className: PropTypes.string
  };

  static defaultProps = {
    className: '',
    items: []
  };

  state = {
    openAllMenuItems: false,
    editItemInfo: null,
    editItemIcon: null
  };

  getAvailableActions = item => {
    return MenuSettingsService.getActiveActions(item);
  };

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
    if ([ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(type.key)) {
      this.setState({
        editItemInfo: {
          type,
          item,
          several: true,
          journalId: type.key === ms.ItemTypes.JOURNAL ? 'ecos-journals' : 'ecos-types'
        }
      });
    } else {
      this.setState({ editItemInfo: { type, item } });
    }
  };

  handleActionItem = ({ action, item }) => {
    const { items, setMenuItems } = this.props;

    if (action === ms.ActionTypes.DELETE) {
      dialogManager.showRemoveDialog({
        title: '',
        text: t('menu-settings.message.delete-item', { name: extractLabel(item.label) }),
        className: 'ecos-modal_width-xs',
        onDelete: () => {
          setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items }));
        }
      });
      return;
    }

    if (action === ms.ActionTypes.EDIT) {
      const type = MenuSettingsService.createOptions.find(o => o.key === item.type);

      type && this.handleChooseOption(type, item);
      return;
    }

    setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items }));
  };

  handleClickIcon = item => {
    this.setState({ editItemIcon: item });
  };

  handleDragEnd = (fromId, toId) => {
    const { items: original, setMenuItems } = this.props;

    setMenuItems(treeMoveItem({ fromId, toId, original, key: 'dndIdx' }));
  };

  renderEditorItem = () => {
    const { editItemInfo } = this.state;
    const { items, customIcons, setMenuItems } = this.props;

    if (!editItemInfo) {
      return null;
    }

    const handleHideModal = () => {
      this.setState({ editItemInfo: null });
    };

    const handleSave = data => {
      setMenuItems(
        MenuSettingsService.processAction({
          action: ms.ActionTypes.EDIT,
          items,
          id: get(editItemInfo, 'item.id'),
          data
        })
      );
      handleHideModal();
    };

    if (editItemInfo.several) {
      return (
        <SelectJournal
          journalId={editItemInfo.journalId}
          isSelectModalOpen
          multiple
          renderView={() => null}
          onChange={handleSave}
          onCancel={handleHideModal}
        />
      );
    }

    return (
      <EditorItemModal
        customIcons={customIcons}
        item={editItemInfo.item}
        type={editItemInfo.type}
        onClose={handleHideModal}
        onSave={handleSave}
      />
    );
  };

  renderEditorIcon = () => {
    const { editItemIcon } = this.state;
    const { items, customIcons, setMenuItems } = this.props;

    const handleHideModal = () => {
      this.setState({ editItemIcon: null });
    };

    const handleSave = icon => {
      setMenuItems(
        MenuSettingsService.processAction({
          action: ms.ActionTypes.EDIT,
          items,
          id: editItemIcon.id,
          data: { edited: true, icon }
        })
      );
      handleHideModal();
    };

    return editItemIcon ? (
      <IconSelect
        customIcons={customIcons}
        prefixIcon="icon-c"
        useFontIcons
        selectedIcon={editItemIcon.icon}
        onClose={handleHideModal}
        onSave={handleSave}
      />
    ) : null;
  };

  renderButtonAddSection = ({ item, level, isOpen }) => {
    if (!item || (level < 3 && !item.hidden && !MenuSettingsService.isChildless(item))) {
      const createOptions = MenuSettingsService.getAvailableCreateOptions(item);

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
    const { items } = this.props;

    return (
      <div className="ecos-menu-settings-editor-items">
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
            draggable={false}
            moveInLevel
            moveInParent
            onDragEnd={this.handleDragEnd}
            getActions={this.getAvailableActions}
            onClickAction={this.handleActionItem}
            onClickIcon={this.handleClickIcon}
            renderExtraComponents={this.renderButtonAddSection}
          />
        </div>
        {this.renderEditorItem()}
        {this.renderEditorIcon()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  items: get(state, 'menuSettings.items', []),
  customIcons: get(state, 'menuSettings.customIcons', [])
});

const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setMenuItems(items))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorItems);
