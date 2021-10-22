import React from 'react';

import { t } from '../../../helpers/util';
import DialogManager from '../../common/dialogs/Manager';
import { IcoBtn } from '../../common/btns';
import { Labels } from '../JournalsMenu/constants';

export default class PresetItem extends React.PureComponent {
  onClick = () => {
    const { onClick, item } = this.props;
    onClick(item);
  };

  handleEdit = e => {
    e.stopPropagation();
    const { item, onEdit } = this.props;
    onEdit(item);
  };

  handleDelete = e => {
    e.stopPropagation();
    const { item, onDelete } = this.props;

    DialogManager.showRemoveDialog({
      title: t(Labels.TEMPLATE_REMOVE_TITLE),
      text: t(t(Labels.TEMPLATE_REMOVE_TEXT, { name: item.displayName })),
      onDelete: () => onDelete(item)
    });
  };

  render() {
    const { item } = this.props;

    return (
      <div className="ecos-journal-menu__list-item" onClick={this.onClick}>
        <div className="ecos-journal-menu__list-item-title">{item.displayName}</div>
        {item.editable && (
          <div className="ecos-journal-menu__list-item-actions">
            <IcoBtn
              title={t(Labels.TEMPLATE_RENAME)}
              icon={'icon-edit'}
              className="ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__list-item-btn ecos-journal-menu__list-item-btn_edit"
              onClick={this.handleEdit}
            />
            <IcoBtn
              title={t(Labels.TEMPLATE_REMOVE)}
              icon={'icon-delete'}
              className="ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__list-item-btn ecos-journal-menu__list-item-btn_delete"
              onClick={this.handleDelete}
            />
          </div>
        )}
      </div>
    );
  }
}
