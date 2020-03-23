import React from 'react';
import ReactDOM from 'react-dom';

import { t } from '../../../../helpers/util';
import { Btn } from '../../btns';
import EcosModal from '../../EcosModal';
import { RemoveDialog } from '../index';

import './DialogManager.scss';

const REMOVE_DIALOG_ID = 'DialogManager-remove-dialog';
const INFO_DIALOG_ID = 'DialogManager-info-dialog';
const CONFIRM_DIALOG_ID = 'DialogManager-confirm-dialog';

class DialogWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
      dialogProps: props.dialogProps || {}
    };
  }

  setProps(props) {
    this.setState({
      dialogProps: props
    });
  }

  setVisible(value) {
    this.setState({
      isVisible: value
    });
  }

  show() {
    this.setVisible(true);
  }

  render() {
    const { isVisible, dialogProps } = this.state;

    return <this.props.dialogComponent isVisible={isVisible} setVisible={value => this.setVisible(value)} dialogProps={dialogProps} />;
  }
}

const dialogsById = {
  [REMOVE_DIALOG_ID]: props => {
    const dialogProps = props.dialogProps || {};
    const { onDelete = () => {}, onCancel = () => {}, onClose = onCancel, title, text } = dialogProps;
    const dProps = {
      ...dialogProps,
      title: t(title || 'record-action.delete.dialog.title.remove-many'),
      text: t(text || 'record-action.delete.dialog.msg.remove-many'),
      isOpen: props.isVisible
    };

    dProps.onDelete = () => {
      props.setVisible(false);
      onDelete();
    };

    dProps.onCancel = () => {
      props.setVisible(false);
      onCancel();
    };

    dProps.onClose = () => {
      props.setVisible(false);
      onClose();
    };

    return <RemoveDialog {...dProps} />;
  },
  [INFO_DIALOG_ID]: props => {
    const dialogProps = props.dialogProps || {};
    const { onClose = () => {}, title, text } = dialogProps;
    const dProps = {
      ...dialogProps,
      title: t(title || ''),
      text: t(text || ''),
      isOpen: props.isVisible
    };

    dProps.onClose = () => {
      props.setVisible(false);
      onClose();
    };

    return (
      <EcosModal title={dProps.title} isOpen={dProps.isOpen} hideModal={dProps.onClose} className="ecos-dialog ecos-dialog_info">
        <div className="ecos-dialog__body">{dProps.text}</div>
        <div className="ecos-dialog__buttons">
          <Btn onClick={dProps.onClose}>{t('button.close-modal')}</Btn>
        </div>
      </EcosModal>
    );
  },
  [CONFIRM_DIALOG_ID]: props => {
    const dialogProps = props.dialogProps || {};
    const { onNo = () => {}, onYes = () => {}, title, text } = dialogProps;
    const dProps = {
      ...dialogProps,
      title: t(title || ''),
      text: t(text || ''),
      isOpen: props.isVisible
    };

    dProps.onNo = () => {
      props.setVisible(false);
      onNo();
    };

    dProps.onYes = () => {
      props.setVisible(false);
      onYes();
    };

    return (
      <EcosModal title={dProps.title} isOpen={dProps.isOpen} hideModal={dProps.onNo} className="ecos-dialog ecos-dialog_confirm">
        <div className="ecos-dialog__body">{dProps.text}</div>
        <div className="ecos-dialog__buttons">
          <Btn onClick={dProps.onYes}>{t('boolean.yes')}</Btn>
          <Btn onClick={dProps.onNo}>{t('boolean.no')}</Btn>
        </div>
      </EcosModal>
    );
  }
};

const dialogs = {};

const showDialog = (id, props) => {
  let dialog = dialogs[id];

  if (!dialog) {
    const dialogComponent = dialogsById[id];

    if (!dialogComponent) {
      throw new Error(`Dialog with id ${id} is not registered`);
    }

    const container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);

    dialog = ReactDOM.render(<DialogWrapper dialogComponent={dialogComponent} dialogProps={props} />, container);

    dialogs[id] = dialog;
  } else {
    dialog.setProps(props);
  }

  dialog.setVisible(true);

  return dialog;
};

export default class DialogManager {
  static showRemoveDialog(props) {
    return showDialog(REMOVE_DIALOG_ID, props);
  }

  static showInfoDialog(props) {
    return showDialog(INFO_DIALOG_ID, props);
  }

  static confirmDialog(props) {
    return showDialog(CONFIRM_DIALOG_ID, props);
  }
}

window.Citeck = window.Citeck || {};
if (!window.Citeck.Dialogs) {
  window.Citeck.Dialogs = DialogManager;
}
