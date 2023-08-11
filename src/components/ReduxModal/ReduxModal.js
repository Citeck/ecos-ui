import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import cn from 'classnames';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import { dialogsById } from '../common/dialogs/Manager/DialogManager';
import { hideModal } from '../../actions/modal';
import { Btn } from '../common/btns';

import './ReduxModal.scss';

const mapStateToProps = state => ({
  ...state.modal
});

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal())
});

class ReduxModal extends React.Component {
  #dialogRef = React.createRef();

  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    document.body.appendChild(this.el);
  }

  componentDidUpdate(prevProps) {
    const { isOpen } = this.props;

    if (isOpen && prevProps.isOpen !== isOpen && this.#dialogRef && this.#dialogRef.current) {
      this.#dialogRef.current.click();
    }
  }

  componentWillUnmount() {
    document.body.removeChild(this.el);
  }

  render() {
    const { dialogId, isOpen, title, content, buttons, onCloseCallback, onSubmit, hideModal } = this.props;

    let onHideCallback = hideModal;
    if (onCloseCallback) {
      onHideCallback = () => {
        onCloseCallback();
        hideModal();
      };
    }

    let onSubmitCallback = hideModal;
    if (onSubmit) {
      onSubmitCallback = () => {
        onSubmit();
        hideModal();
      };
    }

    // todo Стилизовать кнопку в соответствии с макетом
    // const closeBtn = <button className="modal__close-button">&times;</button>;
    //
    // const header = title ? (
    //   <ModalHeader toggle={onHideCallback} close={closeBtn}>
    //     {title}
    //   </ModalHeader>
    // ) : null;

    const header = title ? <ModalHeader toggle={onHideCallback}>{title}</ModalHeader> : null;

    let footer = null;
    if (Array.isArray(buttons) && buttons.length > 0) {
      let mdSize = 12 / buttons.length;
      if (buttons.length === 1) {
        mdSize = { size: 6, offset: 6 };
      }
      const buttonList = buttons.map((button, idx) => {
        let onButtonClick = button.onClick;
        if (button.isCloseButton) {
          onButtonClick = onHideCallback;
        }
        const buttonClassNames = cn('button_full_width', button.className);
        return (
          <Col md={mdSize} sm={12} key={idx}>
            <Btn key={idx} onClick={onButtonClick} className={buttonClassNames}>
              {button.label}
            </Btn>
          </Col>
        );
      });

      footer = (
        <ModalFooter>
          <div className="modal__full-width-block">
            <Row>{buttonList}</Row>
          </div>
        </ModalFooter>
      );
    }

    if (dialogId) {
      const DialogComponent = dialogsById[dialogId];

      return (
        <DialogComponent
          dialogProps={{
            ...this.props,
            dialogRef: this.#dialogRef,
            onCancel: onHideCallback,
            onClose: onHideCallback,
            onDelete: onSubmitCallback
          }}
          isVisible={isOpen}
        />
      );
    }

    return ReactDOM.createPortal(
      <Modal isOpen={isOpen} toggle={onHideCallback}>
        {header}
        <ModalBody>{content}</ModalBody>
        {footer}
      </Modal>,
      this.el
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReduxModal);
