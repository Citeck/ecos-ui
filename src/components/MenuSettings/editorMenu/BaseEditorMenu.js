import classNames from 'classnames';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import uniqueId from 'lodash/uniqueId';
import React from 'react';

import { SystemJournals } from '../../../constants';
import { MenuSettings as ms } from '../../../constants/menu';
import { treeMoveItem } from '../../../helpers/arrayOfObjects';
import { extractLabel, t } from '../../../helpers/util';
import MenuSettingsService from '../../../services/MenuSettingsService';
import IconSelect from '../../IconSelect';
import { PREDICATE_NOT_EMPTY } from '../../Records/predicates/predicates';
import { Tree } from '../../common';
import { Btn } from '../../common/btns';
import DialogManager from '../../common/dialogs/Manager';
import { Badge, DropdownOuter } from '../../common/form';
import EditorItem from '../editorItem/EditorItem';
import { Labels } from '../utils';

import '../style.scss';

export default class BaseEditorMenu extends React.Component {
  configType = undefined;

  state = {
    openAllMenuItems: false,
    editItemInfo: null,
    editItemIcon: null
  };

  componentDidMount() {
    this.handleChooseOption.bind(this);

    if (!this.configType) {
      console.warn('Yon should define type of menu config');
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { lastAddedItems } = this.props;

    if (!isEqual(lastAddedItems, prevProps.lastAddedItems)) {
      const targetEl = document.querySelector(`#id${get(lastAddedItems, [0, 'id'])}`);

      targetEl && targetEl.scrollIntoView();
    }
  }

  getCreateOptions(item, level) {
    return MenuSettingsService.getAvailableCreateOptions(item, { level, configType: this.configType });
  }

  convertItemProps = item => {
    return MenuSettingsService.convertItemForTree(item);
  };

  getAvailableActions = item => {
    if (this.props.disabledEdit) {
      return [];
    }

    return MenuSettingsService.getActiveActions(item);
  };

  get treeEmptyMessage() {
    return '';
  }

  toggleOpenAll = () => {
    this.setState(({ openAllMenuItems }) => ({ openAllMenuItems: !openAllMenuItems }));
  };

  handleChooseOption(editItemInfo = {}) {
    const itemInfoType = get(editItemInfo, 'type.key');

    if (itemInfoType === ms.ItemTypes.JOURNAL || itemInfoType === ms.ItemTypes.PREVIEW_LIST) {
      this.setState({
        editItemInfo: {
          ...editItemInfo,
          several: true,
          journalId: SystemJournals.JOURNALS
        }
      });
      return;
    }

    if (itemInfoType === ms.ItemTypes.KANBAN) {
      this.setState({
        editItemInfo: {
          ...editItemInfo,
          several: true,
          presetFilterPredicates: [
            {
              t: PREDICATE_NOT_EMPTY,
              att: 'journalRef'
            }
          ],
          journalId: SystemJournals.KANBAN
        }
      });
      return;
    }

    if (itemInfoType === ms.ItemTypes.DOCLIB) {
      this.setState({
        editItemInfo: {
          ...editItemInfo,
          several: true,
          presetFilterPredicates: [
            {
              t: PREDICATE_NOT_EMPTY,
              att: 'typeRef._as.ref.aspectById.doclib.ref?raw'
            }
          ],
          journalId: SystemJournals.JOURNALS
        }
      });
      return;
    }

    this.setState({ editItemInfo });
  }

  handleActionItem = ({ action, item, level }) => {
    const { items, setMenuItems } = this.props;

    if (action === ms.ActionTypes.DELETE) {
      DialogManager.showRemoveDialog({
        title: '',
        text: t(Labels.MSG_DELETE_ITEM, { name: extractLabel(item.label) }),
        onDelete: () => {
          if (isFunction(setMenuItems)) {
            setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items, configType: this.configType }).items);
          }
        }
      });
      return;
    }

    if (action === ms.ActionTypes.EDIT) {
      const type = MenuSettingsService.getCreateOptionsByType(this.configType).find(o => o.key === item.type);

      type && this.handleChooseOption({ type, item, action, level });
      return;
    }

    if (isFunction(setMenuItems)) {
      setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items, level, configType: this.configType }).items);
    }
  };

  handleClickIcon = item => {
    if (this.props.disabledEdit) {
      return;
    }

    this.setState({ editItemIcon: item });
  };

  handleDragEnd = (fromId, toId) => {
    const { items: original, setMenuItems } = this.props;
    const sorted = treeMoveItem({ fromId, toId, original, key: 'dndIdx' });

    if (isFunction(setMenuItems)) {
      setMenuItems(sorted);
    }
  };

  handleScrollTree = event => {
    const target = get(event, 'target', null);

    if (!target) {
      return;
    }

    if (target.classList.contains('ecos-dropdown__scrollbar')) {
      return;
    }

    document.body.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  };

  renderEditorItem() {
    const { editItemInfo } = this.state;
    const { items, setMenuItems, addJournalMenuItems, setLastAddedItems, fontIcons } = this.props;

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
        data: { ...data, type: get(editItemInfo, 'type.key') },
        level: editItemInfo.level,
        configType: this.configType
      });

      if (isFunction(setMenuItems)) {
        setMenuItems(result.items);
      }

      if (isFunction(setLastAddedItems)) {
        setLastAddedItems(result.newItems);
      }

      handleHideModal();
    };

    const handleSaveJournal = records => {
      addJournalMenuItems &&
        addJournalMenuItems({
          records,
          id: get(editItemInfo, 'item.id'),
          type: get(editItemInfo, 'type.key'),
          level: editItemInfo.level,
          configType: this.configType
        });
      handleHideModal();
    };

    if (editItemInfo.several) {
      return (
        <EditorItem
          type={editItemInfo.type}
          journalId={editItemInfo.journalId}
          presetFilterPredicates={editItemInfo.presetFilterPredicates}
          onSave={handleSaveJournal}
          onClose={handleHideModal}
        />
      );
    }

    return (
      <EditorItem
        item={editItemInfo.action === ms.ActionTypes.EDIT ? editItemInfo.item : {}}
        type={editItemInfo.type}
        onClose={handleHideModal}
        onSave={handleSave}
        action={editItemInfo.action}
        presetFilterPredicates={editItemInfo.presetFilterPredicates}
        params={{ level: editItemInfo.level, configType: this.configType }}
        fontIcons={fontIcons}
      />
    );
  }

  renderEditorIcon = () => {
    const { editItemIcon } = this.state;
    const { items, setMenuItems, fontIcons } = this.props;

    const handleHideModal = () => {
      this.setState({ editItemIcon: null });
    };

    const handleSave = icon => {
      const result = MenuSettingsService.processAction({
        action: ms.ActionTypes.EDIT,
        items,
        id: editItemIcon.id,
        data: { icon },
        level: editItemIcon.level,
        configType: this.configType
      });

      setMenuItems(result.items);
      handleHideModal();
    };

    return editItemIcon ? (
      <IconSelect
        family="menu-items"
        selectedIcon={editItemIcon.icon}
        onClose={handleHideModal}
        onSave={handleSave}
        myFontIcons={fontIcons}
      />
    ) : null;
  };

  renderExtraComponents = ({ item, level = -1, isOpen }) => {
    const { disabledEdit } = this.props;
    const components = [];
    const id = get(item, 'id') || uniqueId(this.configType);

    if (!item || (!item.hidden && !MenuSettingsService.isChildless(item))) {
      const createOptions = this.getCreateOptions(item, level);

      !disabledEdit &&
        createOptions.length &&
        components.push(
          <DropdownOuter
            key={`${id}--dropdown`}
            source={createOptions}
            valueField={'id'}
            titleField={'label'}
            onChange={type => this.handleChooseOption({ type, item, action: ms.ActionTypes.CREATE, level: level + 1 })}
            isStatic
            boundariesElement="window"
            modifiers={[]}
            withScrollbar
            scrollbarHeightMax={200}
            controlLabel={t(Labels.BTN_ADD)}
            controlIcon="icon-plus"
            className="ecos-menu-settings-editor-items__block-dropdown"
            controlClassName="ecos-btn_sq_sm"
            outClassName="ecos-menu-settings-editor-items__menu-dropdown"
            menuClassName="ecos-menu-settings-editor-items__menu-options"
          />
        );
    }

    if (item && [ms.ItemTypes.JOURNAL].includes(item.type)) {
      const displayCount = get(item, 'config.displayCount');

      components.push(
        <div
          key={`${id}--counter`}
          className={classNames('ecos-menu-settings-editor-items__action-count', {
            'ecos-menu-settings-editor-items__action-count_active': displayCount,
            'ecos-menu-settings-editor-items__action-count_disabled': disabledEdit || item.hidden
          })}
          onClick={() => this.handleActionItem({ action: ms.ActionTypes.DISPLAY_COUNT, level: 0, item })}
        >
          <Badge text={displayCount ? t('menu-settings.editor-items.action.count-off') : t('menu-settings.editor-items.action.count-on')} />
        </div>
      );
    }

    return components;
  };

  renderToggleOpenButton = () => {
    const { openAllMenuItems } = this.state;

    return (
      <Btn className="ecos-btn_sq_sm" onClick={this.toggleOpenAll}>
        {t(openAllMenuItems ? Labels.BTN_COLLAPSE_ALL : Labels.BTN_EXPAND_ALL)}
      </Btn>
    );
  };

  renderDescription() {
    return null;
  }

  renderExtraSettings() {
    return null;
  }

  render() {
    const { openAllMenuItems } = this.state;
    const { items, disabledEdit } = this.props;

    return (
      <div className="ecos-menu-settings-editor-items">
        <div className="ecos-menu-settings-editor-items__header">
          {this.renderExtraComponents({})}
          <div className="ecos--flex-space" />
          {this.renderToggleOpenButton()}
        </div>

        {this.renderDescription()}

        <div className="ecos-menu-settings-editor-items__tree-field" onScroll={this.handleScrollTree}>
          <Tree
            data={items}
            prefixClassName="ecos-menu-settings-editor-items"
            openAll={openAllMenuItems}
            draggable={!disabledEdit}
            moveInParent
            onDragEnd={this.handleDragEnd}
            getActions={this.getAvailableActions}
            convertItemProps={this.convertItemProps}
            emptyMessage={this.treeEmptyMessage}
            onClickAction={this.handleActionItem}
            onClickIcon={this.handleClickIcon}
            renderExtraComponents={this.renderExtraComponents}
          />
        </div>

        {this.renderExtraSettings()}

        {this.renderEditorItem()}
        {this.renderEditorIcon()}
      </div>
    );
  }
}
