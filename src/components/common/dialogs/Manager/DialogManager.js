import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

import { isExistValue, t } from '../../../../helpers/util';
import { Btn } from '../../btns';
import EcosModal from '../../EcosModal';
import { RemoveDialog } from '../index';
import FormWrapper from './FormWrapper';

import './DialogManager.scss';

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
    const {
      onDelete = () => undefined,
      onCancel = () => undefined,
      onClose = onCancel,
      title,
      text,
      className,
      ...otherProps
    } = dialogProps;
    const dProps = {
      ...otherProps,
      title: t(isExistValue(title) ? title : 'record-action.delete.dialog.title.remove-many'),
      text: t(isExistValue(text) ? text : 'record-action.delete.dialog.msg.remove-many'),
      isOpen: props.isVisible
    };

    if (text === '') {
      dProps.text = dProps.title;
      dProps.title = '';
    }

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

    dProps.className = classnames('ecos-dialog ecos-dialog_removal ecos-modal_width-xs', className, {
      'ecos-dialog_headless': !dProps.title
    });

    return <RemoveDialog {...dProps} />;
  },
  [INFO_DIALOG_ID]: props => {
    const dialogProps = props.dialogProps || {};
    const { onClose = () => undefined, title, text, modalClass } = dialogProps;
    const dProps = {
      ...dialogProps,
      title: t(title || ''),
      text: t(text || ''),
      isOpen: props.isVisible
    };

    if (!text) {
      dProps.text = dProps.title;
      dProps.title = '';
    }

    dProps.onClose = () => {
      props.setVisible(false);
      onClose();
    };

    return (
      <EcosModal
        title={dProps.title}
        isOpen={dProps.isOpen}
        hideModal={dProps.onClose}
        className={classnames('ecos-dialog ecos-dialog_info ecos-modal_width-xs', modalClass, { 'ecos-dialog_headless': !dProps.title })}
      >
        <div className="ecos-dialog__body">{dProps.text}</div>
        <div className="ecos-dialog__buttons">
          <Btn onClick={dProps.onClose}>{t('button.close-modal')}</Btn>
        </div>
      </EcosModal>
    );
  },
  [CONFIRM_DIALOG_ID]: props => {
    const dialogProps = props.dialogProps || {};
    const { onNo = () => undefined, onYes = () => undefined, title, text, modalClass = '' } = dialogProps;
    const dProps = {
      ...dialogProps,
      title: t(title || ''),
      text: t(text || ''),
      isOpen: props.isVisible
    };

    if (!text) {
      dProps.text = dProps.title;
      dProps.title = '';
    }

    dProps.onNo = () => {
      props.setVisible(false);
      onNo();
    };

    dProps.onYes = () => {
      props.setVisible(false);
      onYes();
    };

    return (
      <EcosModal
        title={dProps.title}
        isOpen={dProps.isOpen}
        hideModal={dProps.onNo}
        className={classnames('ecos-dialog ecos-dialog_confirm ecos-modal_width-xs', modalClass, { 'ecos-dialog_headless': !dProps.title })}
      >
        {isExistValue(dProps.text) && <div className="ecos-dialog__body">{dProps.text}</div>}
        <div className="ecos-dialog__buttons">
          <Btn onClick={dProps.onNo}>{t('boolean.no')}</Btn>
          <Btn className="ecos-btn_blue" onClick={dProps.onYes}>
            {t('boolean.yes')}
          </Btn>
        </div>
      </EcosModal>
    );
  },
  [CUSTOM_DIALOG_ID]: props => {
    const { isVisible, setVisible } = props;
    const { title = '', onHide = () => undefined, modalClass, body, buttons = [], handlers = {} } = props.dialogProps;

    const hideModal = () => {
      setVisible(false);
      onHide();
    };

    handlers.hideModal = hideModal;

    return (
      <EcosModal
        title={t(title)}
        isOpen={isVisible}
        hideModal={hideModal}
        className={classnames('ecos-dialog ecos-dialog_custom', modalClass)}
      >
        <div className="ecos-dialog__body">{body}</div>
        <div className="ecos-dialog__buttons">
          {buttons.map(b => (
            <Btn
              className={b.className}
              key={b.key || b.label}
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
    const {
      title = '',
      onCancel = () => undefined,
      onSubmit = () => undefined,
      modalClass,
      showDefaultButtons = false
    } = props.dialogProps;

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
      },
      onFormCancel: hideModal
    };

    if (showDefaultButtons && formProps.formDefinition) {
      let definition = formProps.formDefinition;
      if (definition.components) {
        formProps.formDefinition = {
          ...formProps.formDefinition,
          components: [
            ...definition.components,
            {
              label: 'Columns',
              columns: [
                { xs: 0, sm: 12, md: 4, lg: 0, xl: 0, index: 0 },
                {
                  xs: 0,
                  sm: 12,
                  md: 4,
                  lg: 0,
                  xl: 0,
                  index: 1,
                  components: [
                    {
                      label: 'Отмена',
                      type: 'button',
                      action: 'event',
                      block: true,
                      event: 'cancel'
                    }
                  ]
                },
                {
                  xs: 0,
                  sm: 12,
                  md: 4,
                  lg: 0,
                  xl: 0,
                  index: 2,
                  components: [
                    {
                      label: 'Подтвердить',
                      type: 'button',
                      theme: 'primary',
                      action: 'submit',
                      block: true
                    }
                  ]
                }
              ],
              type: 'columns'
            }
          ]
        };
      }
    }

    return (
      <EcosModal
        title={title}
        isOpen={isVisible}
        hideModal={hideModal}
        className={classnames('ecos-dialog ecos-dialog_form', modalClass)}
        reactstrapProps={{ backdrop: false }}
      >
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

  dialog.setVisible(props.isVisible === undefined ? true : props.isVisible);

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
