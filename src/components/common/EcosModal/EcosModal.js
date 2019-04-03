import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../../helpers/util';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import './EcosModal.scss';

const zIndex = 10000;
const maxLevel = 4;
const COMPONENT_CLASS_NAME = 'ecos-modal';

export default class EcosModal extends Component {
  state = {
    isOpen: false,
    level: 0
  };

  static getDerivedStateFromProps(props, state) {
    if (props.isOpen !== state.isOpen) {
      let openModalsCounter = document.querySelectorAll(`.${COMPONENT_CLASS_NAME}`).length;
      openModalsCounter += props.isOpen ? 1 : -1;
      if (openModalsCounter < 0) {
        openModalsCounter = 0;
      }

      return {
        isOpen: props.isOpen,
        level: openModalsCounter
      };
    }

    return null;
  }

  render() {
    const { hideModal, children, title, isBigHeader, className, reactstrapProps } = this.props;
    const { isOpen, level } = this.state;

    const modalZIndex = this.props.zIndex ? this.props.zIndex + level : zIndex + level;

    let levelClassName = null;
    if (level > 0) {
      const modalLevel = level > maxLevel ? maxLevel : level;
      levelClassName = `ecos-modal_level-${modalLevel}`;
    }
    const modalClassName = classNames(COMPONENT_CLASS_NAME, className, levelClassName, {
      'ecos-modal_big-header': isBigHeader
    });

    let closeBtn = (
      <button type="button" className="close" aria-label="Close" onClick={hideModal}>
        <span aria-hidden="true">
          <span className={'icon icon-close'} />
        </span>
      </button>
    );

    if (isBigHeader) {
      closeBtn = (
        <button type="button" className="close" aria-label="Close" onClick={hideModal}>
          <span aria-hidden="true">
            <span className={'ecos-modal-close'}>{t('close-button.label')}</span>
            <span className={'icon icon-close'} />
          </span>
        </button>
      );
    }

    const header = title ? (
      <ModalHeader toggle={hideModal} close={closeBtn}>
        {title}
      </ModalHeader>
    ) : null;

    return (
      <Modal isOpen={isOpen} toggle={hideModal} zIndex={modalZIndex} size={'lg'} className={modalClassName} {...reactstrapProps}>
        {header}
        <ModalBody>{children}</ModalBody>
      </Modal>
    );
  }
}

EcosModal.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  isBigHeader: PropTypes.bool,
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  reactstrapProps: PropTypes.object,
  title: PropTypes.string
};
