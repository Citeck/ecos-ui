import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ModalBody, ModalHeader } from 'reactstrap';
import ReactResizeDetector from 'react-resize-detector';
import throttle from 'lodash/throttle';

import { t, trigger } from '../../../helpers/util';
import Modal from './ModalDraggable';
import { Icon } from '../';

import './EcosModal.scss';

const DEFAULT_Z_INDEX = 10000;
const MAX_LEVEL = 4;

export default class EcosModal extends Component {
  state = {
    isOpen: false,
    level: 0,
    draggableState: null
  };

  static getDerivedStateFromProps(props, state) {
    if (props.isOpen !== state.isOpen) {
      let openModalsCounter = document.querySelectorAll('.ecos-modal').length;
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

  componentDidMount() {
    this.calculateBounds();

    this._onResizeHandlerThrottled = throttle(this.calculateBounds, 300, {
      leading: false,
      trailing: true
    });

    window.addEventListener('resize', this._onResizeHandlerThrottled);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResizeHandlerThrottled);
    this._onResizeHandlerThrottled.cancel();
  }

  componentDidUpdate() {
    this.calculateBounds();
  }

  calculateBounds = () => {
    if (this.props.noDraggable) {
      return;
    }

    if (this._dialog) {
      const boundX = this._dialog.offsetLeft;
      const boundY = this._dialog.offsetTop;
      const draggableState = this.state.draggableState;
      if (draggableState === null || boundX !== draggableState.boundX || boundY !== draggableState.boundY) {
        this.setState({
          draggableState: {
            boundX,
            boundY
          }
        });
      }
    }

    trigger.call(this, 'onCalculateBounds');
  };

  renderCloseButton() {
    const { hideModal, isBigHeader } = this.props;

    return (
      <button type="button" className="close" aria-label="Close" onClick={hideModal}>
        <span aria-hidden="true">
          {isBigHeader && <span className="ecos-modal-close__text">{t('close-button.label')}</span>}
          <Icon className="icon-small-close ecos-modal-close__icon" />
        </span>
      </button>
    );
  }

  renderModalHeader() {
    const { hideModal, title, isEmptyTitle, isBigHeader, customButtons, noHeader, classNameHeader, isTopDivider } = this.props;
    const { level } = this.state;

    return noHeader ? null : (
      <ModalHeader
        toggle={hideModal}
        close={this.renderCloseButton()}
        className={classNames('ecos-modal-header', classNameHeader, `ecos-modal-header_level-${level}`, {
          'ecos-modal-header_big': isBigHeader,
          'ecos-modal-header_divider': isTopDivider
        })}
      >
        {!isEmptyTitle && title && <div className="ecos-modal-header__title">{title}</div>}
        {!!customButtons && !!customButtons.length && <div className="ecos-modal-header__buttons">{customButtons}</div>}
      </ModalHeader>
    );
  }

  render() {
    const { hideModal, children, className, classNameBody, reactstrapProps, isLoading, onResize, zIndex } = this.props;
    const { isOpen, level, draggableState } = this.state;

    const modalZIndex = (zIndex || DEFAULT_Z_INDEX) + level;
    const modalLevel = level > MAX_LEVEL ? MAX_LEVEL : level;
    const modalClassName = classNames('ecos-modal', className, {
      'ecos-modal_draggable': draggableState !== null,
      [`ecos-modal_level-${modalLevel}`]: !!modalLevel
    });

    const draggableProps = {
      disabled: true
    };

    if (draggableState) {
      const { boundX, boundY } = draggableState;

      draggableProps.disabled = false;
      draggableProps.handle = `.ecos-modal-header_level-${level}`;
      draggableProps.bounds = {
        top: -boundY,
        left: -boundX,
        right: boundX
      };
    }

    return (
      <Modal
        isOpen={isOpen}
        isLoading={isLoading}
        toggle={hideModal}
        zIndex={modalZIndex}
        size={'lg'}
        className={modalClassName}
        {...reactstrapProps}
        getDialogRef={el => (this._dialog = el)}
        draggableProps={draggableProps}
        data-level={level}
      >
        {this.renderModalHeader()}
        <ModalBody className={classNameBody}>{children}</ModalBody>
        <ReactResizeDetector handleWidth handleHeight onResize={onResize} />
      </Modal>
    );
  }
}

EcosModal.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classNameHeader: PropTypes.string,
  classNameBody: PropTypes.string,
  isBigHeader: PropTypes.bool,
  isTopDivider: PropTypes.bool,
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  isEmptyTitle: PropTypes.bool,
  noDraggable: PropTypes.bool,
  noHeader: PropTypes.bool,
  hideModal: PropTypes.func,
  reactstrapProps: PropTypes.object,
  title: PropTypes.string,
  onResize: PropTypes.func,
  customButtons: PropTypes.array,
  zIndex: PropTypes.number
};

EcosModal.defaultProps = {
  className: '',
  classNameHeader: '',
  classNameBody: '',
  reactstrapProps: {},
  title: '',
  customButtons: [],
  hideModal: () => null,
  onResize: () => null,
  zIndex: 9000
};
