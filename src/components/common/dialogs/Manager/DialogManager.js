import React from 'react';
import ReactDOM from 'react-dom';
import { t } from '../../../../helpers/util';
import { RemoveDialog } from '../index';

const REMOVE_DIALOG_ID = 'DialogManager-remove-dialog';

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
    return (
      <this.props.dialogComponent
        isVisible={this.state.isVisible}
        setVisible={value => this.setVisible(value)}
        dialogProps={this.state.dialogProps}
      />
    );
  }
}

const dialogsById = {
  [REMOVE_DIALOG_ID]: props => {
    const dialogProps = props.dialogProps || {};

    const { onDelete = () => {}, onCancel = () => {}, onClose = onCancel } = dialogProps;

    let dProps = Object.assign(
      {
        title: t('journals.action.delete-records-msg'),
        text: t('journals.action.remove-records-msg')
      },
      dialogProps,
      {
        isOpen: props.isVisible
      }
    );

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
  }
};

let dialogs = {};

const showDialog = (id, props) => {
  let dialog = dialogs[id];

  if (!dialog) {
    let dialogComponent = dialogsById[id];
    if (!dialogComponent) {
      throw new Error(`Dialog with id ${id} is not registered`);
    }

    let container = document.createElement('div');
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
}

window.Citeck = window.Citeck || {};
if (!window.Citeck.Dialogs) {
  window.Citeck.Dialogs = DialogManager;
}
