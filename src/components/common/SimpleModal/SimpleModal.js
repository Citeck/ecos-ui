import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import './SimpleModal.scss';

const zIndex = 10000;
const maxLevel = 3;
let openModalsCounter = 0;

export default class SimpleModal extends Component {
  state = {
    isOpen: false,
    level: 0
  };

  static getDerivedStateFromProps(props, state) {
    if (props.isOpen !== state.isOpen) {
      openModalsCounter += props.isOpen ? 1 : -1;

      return {
        isOpen: props.isOpen,
        level: openModalsCounter
      };
    }

    return null;
  }

  render() {
    const { hideModal, children, title, className } = this.props;
    const { isOpen, level } = this.state;

    let levelClassName = null;
    if (level > 0) {
      const modalLevel = level > maxLevel ? maxLevel : level;
      levelClassName = `simple-modal_level-${modalLevel}`;
    }
    const modalClassName = classNames(className, levelClassName);

    const header = title ? <ModalHeader toggle={hideModal}>{title}</ModalHeader> : null;

    return (
      <Modal isOpen={isOpen} toggle={hideModal} zIndex={zIndex + level} size={'lg'} className={modalClassName}>
        {header}
        <ModalBody>{children}</ModalBody>
      </Modal>
    );
  }
}

SimpleModal.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  title: PropTypes.string
};
