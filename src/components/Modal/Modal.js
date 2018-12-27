import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { hideModal } from '../../actions/modal';
import Button from '../common/form/Button/Button';

import './Modal.scss';

const mapStateToProps = state => ({
  ...state.modal
});

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal())
});

class CustomModal extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    document.body.appendChild(this.el);
  }

  componentWillUnmount() {
    document.body.removeChild(this.el);
  }

  render() {
    const { isOpen, title, content, buttons, onCloseCallback, hideModal } = this.props;

    let onHideCallback = hideModal;
    if (onCloseCallback) {
      onHideCallback = () => {
        onCloseCallback();
        hideModal();
      };
    }

    if (!isOpen) {
      return null;
    }

    //todo Стилизовать кнопку в соответствии с макетом
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
      const buttonList = buttons.map((button, idx) => {
        let onButtonClick = button.onClick;
        if (button.isCloseButton) {
          onButtonClick = onHideCallback;
        }
        return (
          <Button key={idx} onClick={onButtonClick} color={button.bsStyle} className={button.className}>
            {button.label}
          </Button>
        );
      });

      footer = <ModalFooter>{buttonList}</ModalFooter>;
    }

    return ReactDOM.createPortal(
      <Modal isOpen toggle={onHideCallback}>
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
)(CustomModal);
