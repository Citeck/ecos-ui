import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import { hideModal } from '../actions';

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
        const buttonClassNames = ['button_full_width'];
        if (button.className) {
          buttonClassNames.push(button.className);
        }
        return (
          <Col md={mdSize} sm={12} key={idx}>
            <Button
              key={idx}
              onClick={onButtonClick}
              className={buttonClassNames.join(' ')}
              color={button.color ? button.color : 'secondary'}
            >
              {button.label}
            </Button>
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
