import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import cn from 'classnames';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
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
)(ReduxModal);
