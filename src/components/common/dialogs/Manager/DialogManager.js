import React from 'react';
import ReactDOM from 'react-dom';
import RawHtmlWrapper from '../../RawHtmlWrapper';
import { t } from '../../../../helpers/util';
import { RemoveDialog } from '../index';

const DELETE_DIALOG_ID = 'DialogManager-delete-dialog';

const hideDialog = function() {
  this.props.setWrapperProps({ isDialogShow: false });
};

const dialogsById = {
  [DELETE_DIALOG_ID]: () => {
    const onDelete = () => {
      hideDialog();
      this.props.onDelete(this.props.context);
    };

    const onCancel = () => {
      hideDialog();
      this.props.onCancel(this.props.context);
    };

    return (
      <RemoveDialog
        isOpen={this.props.isDialogShow}
        title={t('journals.action.delete-records-msg')}
        text={t('journals.action.remove-records-msg')}
        onDelete={onDelete}
        onCancel={onCancel}
        onClose={onCancel}
      />
    );
  }
};

let dialogs = {};

const showDialog = (id, props) => {
  let dialog = dialogs[id];

  if (!dialog) {
    let container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);

    let wrapperProps = {};

    dialog = ReactDOM.render(editor, container);
    dialogs[id] = dialog;
  }
};

export default class DialogManager {
  showDeleteDialog({ onDelete, onCancel, context }) {
    let self = this;

    if (!editors[componentKey]) {
      let editor = React.createElement(component);

      let container = document.createElement('div');
      container.id = self.contentId + '-' + componentKey;
      document.body.appendChild(container);

      editors[componentKey] = ReactDOM.render(editor, container);
    }

    editors[componentKey].show(showData, onSubmit);
  }
}
