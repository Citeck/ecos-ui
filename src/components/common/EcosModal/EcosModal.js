import classNames from 'classnames';
import isUndefined from 'lodash/isUndefined';
import throttle from 'lodash/throttle';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { ModalBody, ModalHeader } from 'reactstrap';

import Popper from '../Popper';
import Icon from '../icons/Icon/Icon';

import Modal from './ModalDraggable';

import { getMLValue, isMobileDevice, t, trigger } from '@/helpers/util.js';
import ZIndex from '@/services/ZIndex';

import './EcosModal.scss';

const MAX_LEVEL = 4;

export default class EcosModal extends Component {
  state = {
    isOpen: false,
    level: 0,
    draggableState: null
  };

  static getDerivedStateFromProps(props, state) {
    const { reactstrapProps } = props;
    const { searchZIndexModalClassName } = reactstrapProps || {};

    let newState = null;

    if (props.isOpen !== state.isOpen) {
      let openModalsCounter = document.querySelectorAll('.ecos-modal').length;

      openModalsCounter += props.isOpen ? 1 : -1;

      if (openModalsCounter < 0) {
        openModalsCounter = 0;
      }

      newState = {
        ...newState,
        isOpen: props.isOpen,
        level: isUndefined(props.customLevel) ? openModalsCounter : props.customLevel
      };
    }

    newState = {
      ...newState,
      zIndexCalc: props.isPriorityModal ? ZIndex.calcZ(searchZIndexModalClassName) + 2 : ZIndex.calcZ(searchZIndexModalClassName)
    };

    return newState;
  }

  get searchZIndexModalClassName() {
    const { reactstrapProps } = this.props;
    const { searchZIndexModalClassName } = reactstrapProps || {};
    return searchZIndexModalClassName || '';
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

    const zIndex = this.props.isPriorityModal
      ? ZIndex.calcZ(this.searchZIndexModalClassName) + 2
      : ZIndex.calcZ(this.searchZIndexModalClassName);

    if (zIndex !== this.state.zIndexCalc) {
      this.setState({ zIndexCalc: zIndex });
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
          {isBigHeader && <span className="ecos-modal-close__text">{t('button.close.label')}</span>}
          <Icon className="icon-small-close ecos-modal-close__icon" />
        </span>
      </button>
    );
  }

  renderTitle() {
    const { title, isEmptyTitle } = this.props;

    if (isEmptyTitle || !title) {
      return null;
    }

    const localizedTitle = getMLValue(title);

    const renderTitle = () => <div className="ecos-modal-header__title">{localizedTitle}</div>;

    return (
      <Popper
        showAsNeeded
        text={localizedTitle}
        icon="icon-question"
        popupClassName="ecos-formatter-popper"
        contentComponent={renderTitle()}
      />
    );
  }

  renderModalHeader() {
    const { hideModal, isBigHeader, customButtons, noHeader, classNameHeader, isTopDivider } = this.props;
    const { level } = this.state;

    if (noHeader) {
      return null;
    }

    return (
      <ModalHeader
        toggle={hideModal}
        close={this.renderCloseButton()}
        className={classNames('ecos-modal-header', classNameHeader, `ecos-modal-header_level-${level}`, {
          'ecos-modal-header_big': isBigHeader,
          'ecos-modal-header_divider': isTopDivider
        })}
      >
        {this.renderTitle()}
        {!!customButtons && !!customButtons.length && <div className="ecos-modal-header__buttons">{customButtons}</div>}
      </ModalHeader>
    );
  }

  render() {
    const { hideModal, children, className, classNameBody, reactstrapProps, isLoading, onResize, size, container, isBlurBackground } =
      this.props;
    const { isOpen, level, draggableState, zIndexCalc } = this.state;
    const modalLevel = level > MAX_LEVEL ? MAX_LEVEL : level;
    const classMobile = isMobileDevice() ? 'ecos-modal_mobile' : '';

    const modalClassName = classNames('ecos-modal', className, classMobile, {
      'ecos-modal_draggable': draggableState !== null,
      [`ecos-modal_level-${modalLevel}`]: !!modalLevel,
      'ecos-modal_small-screen': window.innerWidth < 720
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
      // Cause: https://citeck.atlassian.net/browse/ECOSUI-803
      draggableProps.onMouseDown = event => {
        event.stopPropagation();
      };
    }

    return (
      <Modal
        isOpen={isOpen}
        isLoading={isLoading}
        toggle={hideModal}
        zIndex={zIndexCalc}
        size={size}
        className={modalClassName}
        {...reactstrapProps}
        getDialogRef={el => (this._dialog = el)}
        draggableProps={draggableProps}
        data-level={level}
        container={container}
        containerClassName="ecos-modal-container ecosZIndexAnchor"
        isblurbackground={isBlurBackground}
      >
        {this.renderModalHeader()}
        <ModalBody className={classNames(classNameBody, classMobile)}>{children}</ModalBody>
        <ReactResizeDetector handleWidth handleHeight onResize={onResize} />
      </Modal>
    );
  }
}

EcosModal.propTypes = {
  children: PropTypes.node,
  size: PropTypes.string,
  className: PropTypes.string,
  classNameHeader: PropTypes.string,
  classNameBody: PropTypes.string,
  isBigHeader: PropTypes.bool,
  isPriorityModal: PropTypes.bool,
  isTopDivider: PropTypes.bool,
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  isEmptyTitle: PropTypes.bool,
  noDraggable: PropTypes.bool,
  noHeader: PropTypes.bool,
  hideModal: PropTypes.func,
  reactstrapProps: PropTypes.object,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onResize: PropTypes.func,
  customButtons: PropTypes.array
};

EcosModal.defaultProps = {
  className: '',
  size: 'lg',
  classNameHeader: '',
  classNameBody: '',
  reactstrapProps: {},
  title: '',
  customButtons: [],
  hideModal: () => null,
  onResize: () => null
};
