import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import { Collapse, Card, CardBody } from 'reactstrap';

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
const LOADER_DIALOG_ID = 'DialogManager-loader-dialog';
const ERROR_DIALOG_ID = 'DialogManager-error-dialog';

class DialogWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
      isLoading: false,
      dialogProps: props.dialogProps || {}
    };
  }

  get isVisible() {
    return this.state.isVisible;
  }

  setProps(props) {
    this.setState({
      dialogProps: props
    });
  }

  updateProps(props) {
    this.setState(state => ({
      dialogProps: {
        ...state.dialogProps,
        ...props
      }
    }));
  }

  setVisible(isVisible, callback = () => null) {
    this.setState({ isVisible }, callback);
  }

  setLoading(isLoading) {
    this.setState({ isLoading });
  }

  hide() {
    this.setVisible(false);
  }

  show() {
    this.setVisible(true);
  }

  render() {
    const { isVisible, dialogProps, isLoading } = this.state;

    return (
      <this.props.dialogComponent
        isVisible={isVisible}
        isLoading={isLoading}
        setVisible={value => this.setVisible(value)}
        setLoading={value => this.setLoading(value)}
        dialogProps={dialogProps}
      />
    );
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
      isWaitResponse,
      className,
      ...otherProps
    } = dialogProps;
    const dProps = {
      ...otherProps,
      title: t(isExistValue(title) ? title : 'record-action.delete.dialog.title.remove-many'),
      text: t(isExistValue(text) ? text : 'record-action.delete.dialog.msg.remove-many'),
      isOpen: props.isVisible,
      isLoading: props.isLoading
    };

    if (text === '') {
      dProps.text = dProps.title;
      dProps.title = '';
    }

    dProps.onDelete = async () => {
      if (isWaitResponse) {
        props.setLoading(true);
        await onDelete();
        props.setVisible(false);
        props.setLoading(false);

        return;
      }

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

    dProps.className = classNames('ecos-dialog ecos-dialog_removal ecos-modal_width-xs', className, {
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
        className={classNames('ecos-dialog ecos-dialog_info ecos-modal_width-xs', modalClass, { 'ecos-dialog_headless': !dProps.title })}
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
        className={classNames('ecos-dialog ecos-dialog_confirm ecos-modal_width-xs', modalClass, { 'ecos-dialog_headless': !dProps.title })}
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
    const { title = '', onHide = () => undefined, modalClass, body, buttons = [], handlers = {}, ...modalProps } = props.dialogProps;

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
        className={classNames('ecos-dialog ecos-dialog_custom', modalClass)}
        {...modalProps}
      >
        <div className="ecos-dialog__body">{body}</div>
        {!isEmpty(buttons) && (
          <div className="ecos-dialog__buttons">
            {buttons.map(b => (
              <Btn
                className={b.className}
                key={b.key || b.label}
                onClick={() => {
                  if (typeof b.onClick === 'function') {
                    b.onClick();
                  }
                  hideModal();
                }}
              >
                {t(b.label)}
              </Btn>
            ))}
          </div>
        )}
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
      showDefaultButtons = false,
      reactstrapProps = {}
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
                      label: t('btn.cancel.label'),
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
                      label: t('btn.confirm.label'),
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
        className={classNames('ecos-dialog ecos-dialog_form', modalClass)}
        reactstrapProps={{ backdrop: 'static', ...reactstrapProps }}
      >
        <div className="ecos-dialog__body">
          <FormWrapper isVisible {...formProps} />
        </div>
      </EcosModal>
    );
  },
  [ERROR_DIALOG_ID]: props => {
    const [isOpenInfo, setOpenInfo] = useState(props.isOpenInfo);
    const dialogProps = props.dialogProps || {};
    const { onClose, title, text, modalClass } = dialogProps;
    const dProps = {
      ...dialogProps,
      title: t(title || ''),
      text: t(text || ''),
      isOpen: props.isVisible
    };
    let { buttons } = dialogProps;

    dProps.onClose = () => {
      props.setVisible(false);
      setOpenInfo(false);
      isFunction(onClose) && onClose();
    };

    dProps.onToggle = () => {
      setOpenInfo(!isOpenInfo);
    };

    if (isEmpty(buttons)) {
      buttons = [
        {
          className: 'ecos-btn_blue',
          label: 'button.ok',
          onClick: dProps.onClose
        }
      ];
    }

    return (
      <EcosModal
        title={dProps.title}
        isOpen={dProps.isOpen}
        hideModal={dProps.onClose}
        className={classNames('ecos-dialog ecos-dialog_info ecos-modal_width-xs', modalClass, { 'ecos-dialog_headless': !dProps.title })}
      >
        <div className="ecos-dialog__body">
          <p className={classNames('mb-1', dProps.descriptionClassNames)}>{dProps.text}</p>
          {!isEmpty(dProps.error) && (
            <>
              <span className="ecos-dialog__pseudo-link mt-3" onClick={dProps.onToggle}>
                {t('more-about-error.label')}
              </span>
              <Collapse isOpen={isOpenInfo}>
                <Card className="mt-3">
                  <CardBody className="ecos-dialog__body-error">
                    <span dangerouslySetInnerHTML={{ __html: dProps.error }} />
                  </CardBody>
                </Card>
              </Collapse>
            </>
          )}
        </div>
        <div className="ecos-dialog__buttons ecos-dialog__buttons_center">
          {buttons.map(b => (
            <Btn
              className={b.className}
              key={b.key || b.label}
              onClick={() => {
                isFunction(b.onClick) && b.onClick();
              }}
            >
              {t(b.label)}
            </Btn>
          ))}
        </div>
      </EcosModal>
    );
  },
  [LOADER_DIALOG_ID]: props => {
    const { isVisible } = props;
    const { text } = props.dialogProps;

    return (
      <EcosModal isLoading noHeader noDraggable isOpen={isVisible} className="ecos-dialog ecos-dialog_loader">
        <div className="ecos-dialog_loader-status">{t(text || 'waiting')}</div>
      </EcosModal>
    );
  }
};

const dialogs = {};

const showDialog = (id, props = {}) => {
  const isVisible = isExistValue(props.isVisible) ? props.isVisible : true;
  const _id = props.instance ? `${id}-${props.instance}` : id;
  let dialog = dialogs[_id];

  if (!dialog) {
    const dialogComponent = dialogsById[id];

    if (!dialogComponent) {
      throw new Error(`Dialog with id ${id}  (instance ${props.instance}) is not registered`);
    }

    const container = document.createElement('div');
    container.id = _id;
    document.body.appendChild(container);

    dialog = ReactDOM.render(<DialogWrapper dialogComponent={dialogComponent} dialogProps={props} />, container);

    dialogs[_id] = dialog;
  } else {
    dialog.setProps(props);
  }

  dialog.setVisible(isVisible, checkLoader);

  return dialog;
};

function checkLoader() {
  if (dialogs[LOADER_DIALOG_ID]) {
    for (let key in dialogs) {
      if (key !== LOADER_DIALOG_ID && dialogs[key].isVisible) {
        dialogs[LOADER_DIALOG_ID].setVisible(false);
        return;
      }
    }
  }
}

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

  static showErrorDialog(props) {
    return showDialog(ERROR_DIALOG_ID, props);
  }

  /**
   * Display dialog loader; Manual or auto control
   * @param props {?Object} other props or open state
   */
  static toggleLoader(props = {}) {
    const isVisible = props.isVisible || (dialogs[LOADER_DIALOG_ID] && dialogs[LOADER_DIALOG_ID].isVisible);

    return showDialog(LOADER_DIALOG_ID, { ...props, isVisible });
  }

  static hideAllDialogs() {
    for (let id in dialogs) {
      dialogs[id].hide && dialogs[id].hide();
    }
  }
}

window.Citeck = window.Citeck || {};
if (!window.Citeck.Dialogs) {
  window.Citeck.Dialogs = DialogManager;
}
