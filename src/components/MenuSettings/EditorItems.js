import React from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { extractLabel, t } from '../../helpers/util';
import { treeMoveItem } from '../../helpers/arrayOfObjects';
import { MenuSettings as ms } from '../../constants/menu';
import MenuSettingsService from '../../services/MenuSettingsService';
import { addJournalMenuItems, setLastAddedItems, setMenuItems } from '../../actions/menuSettings';
import IconSelect from '../IconSelect';
import { Tree } from '../common';
import { Btn } from '../common/btns';
import { Badge, DropdownOuter, SelectJournal } from '../common/form';
import DialogManager from '../common/dialogs/Manager';
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
  state = {
    openAllMenuItems: false,
    editItemInfo: null,
    editItemIcon: null
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { lastAddedItems } = this.props;

    if (!isEqual(lastAddedItems, prevProps.lastAddedItems)) {
      const targetEl = document.querySelector(`#id${get(lastAddedItems, [0, 'id'])}`);

      targetEl && targetEl.scrollIntoView();
    }
  }

  getAvailableActions = item => {
    return MenuSettingsService.getActiveActions(item);
  };

  toggleOpenAll = () => {
    this.setState(({ openAllMenuItems }) => ({ openAllMenuItems: !openAllMenuItems }));
  };

  handleChooseOption = (editItemInfo = {}) => {
    if ([ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(get(editItemInfo, 'type.key'))) {
      this.setState({
        editItemInfo: {
          ...editItemInfo,
          several: true,
          journalId: get(editItemInfo, 'type.key') === ms.ItemTypes.JOURNAL ? 'ecos-all-journals' : 'ecos-types'
        }
      });
    } else {
      this.setState({ editItemInfo });
    }
  };

  handleActionItem = ({ action, item }) => {
    const { items, setMenuItems } = this.props;

    if (action === ms.ActionTypes.DELETE) {
      DialogManager.showRemoveDialog({
        title: '',
        text: t('menu-settings.message.delete-item', { name: extractLabel(item.label) }),
        className: 'ecos-modal_width-xs',
        onDelete: () => {
          setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items }).items);
        }
      });
      return;
    }

    if (action === ms.ActionTypes.EDIT) {
      const type = MenuSettingsService.createOptions.find(o => o.key === item.type);

      type && this.handleChooseOption({ type, item, action });
      return;
    }

    setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items }).items);
  };

  handleClickIcon = item => {
    this.setState({ editItemIcon: item });
  };

  handleDragEnd = (fromId, toId) => {
    const { items: original, setMenuItems } = this.props;
    const sorted = treeMoveItem({ fromId, toId, original, key: 'dndIdx' });

    setMenuItems(sorted);
  };

  renderEditorItem = () => {
    const { editItemInfo } = this.state;
    const { items, setMenuItems, addJournalMenuItems, setLastAddedItems } = this.props;

    if (!editItemInfo) {
      return null;
    }

    const handleHideModal = () => {
      this.setState({ editItemInfo: null });
    };

    const handleSave = data => {
      const result = MenuSettingsService.processAction({
        action: editItemInfo.action,
        items,
        id: get(editItemInfo, 'item.id'),
        data: { ...data, type: get(editItemInfo, 'type.key') }
      });
      setMenuItems(result.items);
      setLastAddedItems(result.newItems);
      handleHideModal();
    };

    const handleSaveJournal = records => {
      addJournalMenuItems({
        records,
        id: get(editItemInfo, 'item.id'),
        type: get(editItemInfo, 'type.key')
      });
      handleHideModal();
    };

    if (editItemInfo.several) {
      return (
        <SelectJournal
          journalId={editItemInfo.journalId}
          isSelectModalOpen
          multiple
          renderView={() => null}
          onChange={handleSaveJournal}
          onCancel={handleHideModal}
        />
      );
    }

    return (
      <EditorItemModal
        item={editItemInfo.item}
        type={editItemInfo.type}
        onClose={handleHideModal}
        onSave={handleSave}
        action={editItemInfo.action}
      />
    );
  };

  renderEditorIcon = () => {
    const { editItemIcon } = this.state;
    const { items, setMenuItems } = this.props;

    const handleHideModal = () => {
      this.setState({ editItemIcon: null });
    };

    const handleSave = icon => {
      const result = MenuSettingsService.processAction({
        action: ms.ActionTypes.EDIT,
        items,
        id: editItemIcon.id,
        data: { icon }
      });

      setMenuItems(result.items);
      handleHideModal();
    };

    return editItemIcon ? (
      <IconSelect
        prefixIcon="leftmenu"
        family="menu-items"
        useFontIcons
        selectedIcon={editItemIcon.icon}
        onClose={handleHideModal}
        onSave={handleSave}
      />
    ) : null;
  };

  renderExtraComponents = ({ item, level, isOpen }) => {
    const components = [];
    const id = get(item, 'id');

    if (!item || (level < 3 && !item.hidden && !MenuSettingsService.isChildless(item))) {
      const createOptions = MenuSettingsService.getAvailableCreateOptions(item);

      createOptions &&
        createOptions.length &&
        components.push(
          <DropdownOuter
            key={`${id}--dropdown`}
            source={createOptions}
            valueField={'id'}
            titleField={'label'}
            onChange={type => this.handleChooseOption({ type, item, action: ms.ActionTypes.CREATE })}
            isStatic
            controlLabel={t(Labels.BTN_ADD)}
            controlIcon="icon-plus"
            controlClassName="ecos-btn_hover_light-blue2 ecos-btn_sq_sm"
            outClassName="ecos-menu-settings-editor-items__menu-dropdown"
            menuClassName="ecos-menu-settings-editor-items__menu-options"
          />
        );
    }

    if (item && [ms.ItemTypes.JOURNAL].includes(item.type)) {
      const displayCount = get(item, 'config.displayCount');
      const count = String(get(item, 'config.count', 0));

      components.push(
        <div
          key={`${id}--counter`}
          className={classNames('ecos-menu-settings-editor-items__action-count', {
            'ecos-menu-settings-editor-items__action-count_active': displayCount,
            'ecos-menu-settings-editor-items__action-count_disabled': item.hidden
          })}
          onClick={() => this.handleActionItem({ action: ms.ActionTypes.DISPLAY_COUNT, item })}
        >
          <Badge text={count} />
          <span>{displayCount ? t('menu-settings.editor-items.action.count-off') : t('menu-settings.editor-items.action.count-on')}</span>
        </div>
      );
    }

    return components;
  };

  render() {
    const { openAllMenuItems } = this.state;
    const { items } = this.props;

    return (
      <div className="ecos-menu-settings-editor-items">
        <div className="ecos-menu-settings-editor-items__header">
          <div className="ecos-menu-settings__subtitle ecos-menu-settings-editor-items__subtitle">{t(Labels.SUBTITLE)}</div>
          {this.renderExtraComponents({})}
          <div className="ecos--flex-space" />
          <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={this.toggleOpenAll}>
            {t(openAllMenuItems ? Labels.BTN_COLLAPSE_ALL : Labels.BTN_EXPAND_ALL)}
          </Btn>
        </div>
        <div className="ecos-menu-settings-editor-items__tree-field">
          <Tree
            data={items}
            prefixClassName="ecos-menu-settings-editor-items"
            openAll={openAllMenuItems}
            draggable
            moveInParent
            onDragEnd={this.handleDragEnd}
            getActions={this.getAvailableActions}
            onClickAction={this.handleActionItem}
            onClickIcon={this.handleClickIcon}
            renderExtraComponents={this.renderExtraComponents}
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
  lastAddedItems: get(state, 'menuSettings.lastAddedItems', [])
});

const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setMenuItems(items)),
  setLastAddedItems: items => dispatch(setLastAddedItems(items)),
  addJournalMenuItems: data => dispatch(addJournalMenuItems(data))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorItems);
