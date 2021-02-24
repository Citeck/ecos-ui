import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { SystemJournals } from '../../../constants';
import { ConfigTypes, MenuSettings as ms } from '../../../constants/menu';
import { addJournalMenuItems, setLastAddedLeftItems, setLeftMenuItems } from '../../../actions/menuSettings';
import MenuSettingsService from '../../../services/MenuSettingsService';
import { SelectJournal } from '../../common/form';
import BaseEditorMenu from './BaseEditorMenu';
import EditorItemModal from './EditorItemModal';

class EditorLeftMenu extends BaseEditorMenu {
  type = ConfigTypes.LEFT;

  handleChooseOption = (editItemInfo = {}) => {
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
  };

  renderEditorItem = () => {
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
        params={{ level: editItemInfo.level }}
        fontIcons={fontIcons}
      />
    );
  };
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.leftItems', []),
  fontIcons: get(state, 'menuSettings.fontIcons', []),
  lastAddedItems: get(state, 'menuSettings.lastAddedLeftItems', [])
});

const mapDispatchToProps = dispatch => ({
  setMenuItems: items => dispatch(setLeftMenuItems(items)),
  setLastAddedItems: items => dispatch(setLastAddedLeftItems(items)),
  addJournalMenuItems: data => dispatch(addJournalMenuItems(data))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorLeftMenu);
