import React from 'react';
import ReactDOM from 'react-dom';

import { t } from '../../../../helpers/util';
import { Btn } from '../../btns';
import EcosModal from '../../EcosModal';
import { RemoveDialog } from '../index';

import './DialogManager.scss';
import FormWrapper from './FormWrapper';

const REMOVE_DIALOG_ID = 'DialogManager-remove-dialog';
const INFO_DIALOG_ID = 'DialogManager-info-dialog';
const CONFIRM_DIALOG_ID = 'DialogManager-confirm-dialog';
const CUSTOM_DIALOG_ID = 'DialogManager-custom-dialog';
const FORM_DIALOG_ID = 'DialogManager-form-dialog';

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
      title: t(title !== null && title !== undefined ? title : 'record-action.delete.dialog.title.remove-many'),
      text: t(title !== null && title !== undefined ? text : 'record-action.delete.dialog.msg.remove-many'),
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
  },
  [CUSTOM_DIALOG_ID]: props => {
    const { isVisible, setVisible } = props;

    const { title = '', onHide = () => {}, modalClass = 'ecos-dialog_info', body, buttons = [], handlers = {} } = props.dialogProps;

    const hideModal = () => {
      setVisible(false);
      onHide();
    };

    handlers.hideModal = hideModal;

    return (
      <EcosModal title={title} isOpen={isVisible} hideModal={hideModal} className={`ecos-dialog ${modalClass}`}>
        <div className="ecos-dialog__body">{body}</div>
        <div className="ecos-dialog__buttons">
          {buttons.map(b => (
            <Btn
              onClick={() => {
                b.onClick();
                hideModal();
              }}
            >
              {t(b.label)}
            </Btn>
          ))}
        </div>
      </EcosModal>
    );
  },
  [FORM_DIALOG_ID]: props => {
    const { isVisible, setVisible } = props;

    const { title = '', onCancel = () => {}, onSubmit = () => {}, modalClass = 'ecos-dialog_info' } = props.dialogProps;

    const hideModal = () => {
      setVisible(false);
      onCancel();
    };

    const formProps = {
      ...props.dialogProps,
      onSubmit: submission => {
        const res = onSubmit(submission);
        if (res && res.then) {
          return res.then(() => setVisible(false));
        } else {
          setVisible(false);
        }
      }
    };

    return (
      <EcosModal title={title} isOpen={isVisible} hideModal={hideModal} className={`ecos-dialog ${modalClass}`}>
        <div className="ecos-dialog__body">
          <FormWrapper isVisible {...formProps} />
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

  static showCustomDialog(props) {
    return showDialog(CUSTOM_DIALOG_ID, props);
  }

  static showFormDialog(props) {
    return showDialog(FORM_DIALOG_ID, props);
  }
}

window.Citeck = window.Citeck || {};
if (!window.Citeck.Dialogs) {
  window.Citeck.Dialogs = DialogManager;
}
