import React from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';
import classNames from 'classnames';

import { extractLabel, t } from '../../../helpers/util';
import { treeMoveItem } from '../../../helpers/arrayOfObjects';
import { SystemJournals } from '../../../constants';
import { MenuSettings as ms } from '../../../constants/menu';
import MenuSettingsService from '../../../services/MenuSettingsService';
import IconSelect from '../../IconSelect';
import { Tree } from '../../common';
import { Btn } from '../../common/btns';
import { Badge, DropdownOuter } from '../../common/form';
import DialogManager from '../../common/dialogs/Manager';
import { Labels } from './../utils';
import EditorItem from '../editorItem/EditorItem';

import '../style.scss';

export default class BaseEditorMenu extends React.Component {
  type = undefined;

  state = {
    openAllMenuItems: false,
    editItemInfo: null,
    editItemIcon: null
  };

  componentDidMount() {
    this.handleChooseOption.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { lastAddedItems } = this.props;

    if (!isEqual(lastAddedItems, prevProps.lastAddedItems)) {
      const targetEl = document.querySelector(`#id${get(lastAddedItems, [0, 'id'])}`);

      targetEl && targetEl.scrollIntoView();
    }
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

  toggleOpenAll = () => {
    this.setState(({ openAllMenuItems }) => ({ openAllMenuItems: !openAllMenuItems }));
  };

  handleChooseOption(editItemInfo = {}) {
    if ([ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(get(editItemInfo, 'type.key'))) {
      this.setState({
        editItemInfo: {
          ...editItemInfo,
          several: true,
          journalId: get(editItemInfo, 'type.key') === ms.ItemTypes.JOURNAL ? SystemJournals.JOURNALS : SystemJournals.TYPES
        }
      });
    } else {
      this.setState({ editItemInfo });
    }
  }

  handleActionItem = ({ action, item, level }) => {
    const { items, setMenuItems } = this.props;

    if (action === ms.ActionTypes.DELETE) {
      DialogManager.showRemoveDialog({
        title: '',
        text: t(Labels.MSG_DELETE_ITEM, { name: extractLabel(item.label) }),
        onDelete: () => {
          const result = MenuSettingsService.processAction({ action, id: item.id, items });
          setMenuItems(result.items);
        }
      });
      return;
    }

    if (action === ms.ActionTypes.EDIT) {
      const type = MenuSettingsService.getCreateOptionsByType(this.type).find(o => o.key === item.type);

      type && this.handleChooseOption({ type, item, action, level });
      return;
    }

    setMenuItems(MenuSettingsService.processAction({ action, id: item.id, items, level }).items);
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

    setMenuItems(sorted);
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
        level: editItemInfo.level
      });
      setMenuItems(result.items);
      setLastAddedItems(result.newItems);
      handleHideModal();
    };

    const handleSaveJournal = records => {
      addJournalMenuItems({
        records,
        id: get(editItemInfo, 'item.id'),
        type: get(editItemInfo, 'type.key'),
        level: editItemInfo.level
      });
      handleHideModal();
    };

    if (editItemInfo.several) {
      return (
        <EditorItem type={editItemInfo.type} journalId={editItemInfo.journalId} onSave={handleSaveJournal} onClose={handleHideModal} />
      );
    }

    return (
      <EditorItem
        item={editItemInfo.action === ms.ActionTypes.EDIT ? editItemInfo.item : {}}
        type={editItemInfo.type}
        onClose={handleHideModal}
        onSave={handleSave}
        action={editItemInfo.action}
        params={{ level: editItemInfo.level, configType: this.type }}
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
        level: editItemIcon.level
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
    const id = get(item, 'id') || uniqueId(this.type);

    if (!item || (!item.hidden && !MenuSettingsService.isChildless(item))) {
      const createOptions = MenuSettingsService.getAvailableCreateOptions(this.type, item, { level });

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
            modifiers={null}
            withScrollbar
            scrollbarHeightMax={200}
            controlLabel={t(Labels.BTN_ADD)}
            controlIcon="icon-plus"
            className="ecos-menu-settings-editor-items__block-dropdown"
            controlClassName="ecos-btn_hover_light-blue2 ecos-btn_sq_sm"
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

  render() {
    const { openAllMenuItems } = this.state;
    const { items, disabledEdit } = this.props;

    return (
      <div className="ecos-menu-settings-editor-items">
        <div className="ecos-menu-settings-editor-items__header">
          {this.renderExtraComponents({})}
          <div className="ecos--flex-space" />
          <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={this.toggleOpenAll}>
            {t(openAllMenuItems ? Labels.BTN_COLLAPSE_ALL : Labels.BTN_EXPAND_ALL)}
          </Btn>
        </div>
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
