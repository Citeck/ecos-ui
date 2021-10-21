import React from 'react';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import DialogManager from '../../common/dialogs/Manager';
import { IcoBtn } from '../../common/btns';
import { Labels } from './constants';

export default class ListItem extends React.Component {
  onClick = () => {
    const { onClick, item } = this.props;
    onClick(item);
  };

  handleEdit = () => {};

  handleDelete = () => {
    const { item } = this.props;

    DialogManager.showRemoveDialog({
      title: t(Labels.TEMPLATE_REMOVE_TITLE),
      text: t(t(Labels.TEMPLATE_REMOVE_TEXT, { name: get(item, 'data.title') })),
      onDelete: () => this.props.resetConfig()
    });
  };

  render() {
    const { item } = this.props;
    const data = get(item, 'data', {});

    return (
      <>
        <div
          className="ecos-journal-menu__list-item"
          onClick={this.onClick}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
        >
          <div className="ecos-journal-menu__list-item-title">{data.title}</div>
          {data.editable && (
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
      </>
    );
  }
}
