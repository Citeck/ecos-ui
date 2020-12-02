import React from 'react';
import classNames from 'classnames';

import { getPropByStringKey, t, trigger } from '../../../helpers/util';
import { JOURNAL_SETTING_ID_FIELD } from '../constants';
import { Input } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { RemoveDialog } from '../../common/dialogs';

const Labels = {
  TEMPLATE_CANCEL: 'journals.action.cancel-rename-tpl-msg',
  TEMPLATE_RENAME: 'journals.action.rename-tpl-msg',
  TEMPLATE_REMOVE: 'journals.action.remove-tpl-msg',
  TEMPLATE_REMOVE_TITLE: 'journals.action.delete-tpl-msg',
  TEMPLATE_REMOVE_TEXT: 'journals.action.remove-tpl-msg'
};

class ListItem extends React.Component {
  constructor(props) {
    super(props);

    const title = getPropByStringKey(props.item, props.titleField);

    this.state = {
      isMouseOver: false,
      isDialogShow: false,
      isRenameMode: false,
      title: title,
      _title: title
    };
  }

  onClick = () => {
    const { onClick, item } = this.props;
    onClick(item);
  };

  delete = () => {
    trigger.call(this, 'onDelete', this.props.item);
    this.closeDialog();
  };

  apply = () => {
    const title = this.state._title;
    trigger.call(this, 'onApply', { id: this.props.item[JOURNAL_SETTING_ID_FIELD], title });
    this.setState({ title });
    this.hideRenameMode();
  };

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  showDialog = e => {
    e.stopPropagation();
    this.setState({ isDialogShow: true });
  };

  showRenameMode = e => {
    e.stopPropagation();
    this.setState({ isRenameMode: true });
  };

  hideRenameMode = () => {
    this.setState({ isRenameMode: false });
  };

  cancelRenameMode = () => {
    this.hideRenameMode();
    this.setState({ _title: this.state.title });
  };

  onChangeTitle = e => {
    this.setState({ _title: e.target.value });
  };

  onKeyPress = e => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      this.apply();
    }
  };

  onMouseOver = () => {
    this.setState({ isMouseOver: true });
  };

  onMouseLeave = () => {
    this.setState({ isMouseOver: false });
  };

  render() {
    const { item, removable } = this.props;
    const { isMouseOver, isDialogShow, isRenameMode, title, _title } = this.state;
    const hasActions = removable && !item.notRemovable && isMouseOver;

    return (
      <>
        {isRenameMode ? (
          <>
            <Input
              type={'text'}
              autoFocus
              autoSelect
              className="ecos-journal-menu__list-item-input"
              value={_title}
              onChange={this.onChangeTitle}
              onKeyPress={this.onKeyPress}
            />

            <IcoBtn
              title={t(Labels.TEMPLATE_CANCEL)}
              icon={'icon-small-close'}
              className="ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_red ecos-btn_hover_t_light-red ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_cancel"
              onClick={this.cancelRenameMode}
            />

            <IcoBtn
              title={t(Labels.TEMPLATE_RENAME)}
              icon={'icon-small-check'}
              className="ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_green ecos-btn_hover_t_light-green ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_apply"
              onClick={this.apply}
            />
          </>
        ) : (
          <div
            className={classNames('ecos-journal-menu__list-item', {
              'ecos-journal-menu__list-item_hover': isMouseOver,
              'ecos-journal-menu__list-item_actions': hasActions
            })}
            onClick={this.onClick}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
          >
            <span>{title}</span>

            {hasActions ? (
              <>
                <IcoBtn
                  title={t(Labels.TEMPLATE_RENAME)}
                  icon={'icon-edit'}
                  className="ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_edit"
                  onClick={this.showRenameMode}
                />
                <IcoBtn
                  title={t(Labels.TEMPLATE_REMOVE)}
                  icon={'icon-delete'}
                  className="ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_delete"
                  onClick={this.showDialog}
                />
              </>
            ) : null}
          </div>
        )}

        <RemoveDialog
          isOpen={isDialogShow}
          title={t(Labels.TEMPLATE_REMOVE_TITLE)}
          text={t(Labels.TEMPLATE_REMOVE_TEXT, { name: title })}
          onCancel={this.closeDialog}
          onDelete={this.delete}
          onClose={this.closeDialog}
        />
      </>
    );
  }
}

export default ListItem;
