import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Draggable from 'react-draggable';
import Fade from 'reactstrap/lib/Fade';
import Portal from 'reactstrap/lib/Portal';
import {
  conditionallyUpdateScrollbar,
  focusableElements,
  getOriginalBodyPadding,
  mapToCssModules,
  omit,
  setScrollbarWidth,
  TransitionTimeouts
} from 'reactstrap/lib/utils';

import Loader from '../Loader/Loader';

function noop() {}

const FadePropTypes = PropTypes.shape(Fade.propTypes); // eslint-disable-line

const propTypes = {
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  autoFocus: PropTypes.bool,
  centered: PropTypes.bool,
  scrollable: PropTypes.bool,
  size: PropTypes.string,
  toggle: PropTypes.func,
  keyboard: PropTypes.bool,
  role: PropTypes.string,
  labelledBy: PropTypes.string,
  backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['static'])]),
  onEnter: PropTypes.func,
  onExit: PropTypes.func,
  onOpened: PropTypes.func,
  onClosed: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  wrapClassName: PropTypes.string,
  modalClassName: PropTypes.string,
  backdropClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  external: PropTypes.node,
  fade: PropTypes.bool,
  cssModule: PropTypes.object,
  zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  backdropTransition: FadePropTypes,
  modalTransition: FadePropTypes,
  innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]),
  draggableProps: PropTypes.object,
  getDialogRef: PropTypes.func
};

const propsToOmit = Object.keys(propTypes);

const defaultProps = {
  isOpen: false,
  isLoading: false,
  autoFocus: true,
  centered: false,
  scrollable: false,
  role: 'dialog',
  backdrop: true,
  keyboard: false,
  zIndex: 1050,
  fade: true,
  onOpened: noop,
  onClosed: noop,
  modalTransition: {
    timeout: TransitionTimeouts.Modal
  },
  backdropTransition: {
    mountOnEnter: true,
    timeout: TransitionTimeouts.Fade // uses standard fade transition
  }
};

class Modal extends React.Component {
  constructor(props) {
    super(props);

    this._element = null;
    this._originalBodyPadding = null;
    this.getFocusableChildren = this.getFocusableChildren.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.handleBackdropMouseDown = this.handleBackdropMouseDown.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.onOpened = this.onOpened.bind(this);
    this.onClosed = this.onClosed.bind(this);

    this.state = {
      isOpen: props.isOpen
    };

    if (props.isOpen) {
      this.init(props.container);
    }
  }

  componentDidMount() {
    if (this.props.onEnter) {
      this.props.onEnter();
    }

    if (this.state.isOpen && this.props.autoFocus) {
      this.setFocus();
    }

    this._isMounted = true;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen && !this.props.isOpen) {
      this.setState({ isOpen: nextProps.isOpen });
    }
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    if (nextState.isOpen && !this.state.isOpen) {
      this.init();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.autoFocus && this.state.isOpen && !prevState.isOpen) {
      this.setFocus();
    }

    if (this._element && prevProps.zIndex !== this.props.zIndex) {
      this._element.style.zIndex = this.props.zIndex;
    }
  }

  componentWillUnmount() {
    if (this.props.onExit) {
      this.props.onExit();
    }

    if (this.state.isOpen) {
      this.destroy();
    }

    this._isMounted = false;
  }

  onOpened(node, isAppearing) {
    this.props.onOpened();
    (this.props.modalTransition.onEntered || noop)(node, isAppearing);
  }

  onClosed(node) {
    // so all methods get called before it is unmounted
    this.props.onClosed();
    (this.props.modalTransition.onExited || noop)(node);
    this.destroy();

    if (this._isMounted) {
      this.setState({ isOpen: false });
    }
  }

  setFocus() {
    if (this._dialog && this._dialog.parentNode && typeof this._dialog.parentNode.focus === 'function') {
      this._dialog.parentNode.focus();
    }
  }

  getFocusableChildren() {
    return this._element.querySelectorAll(focusableElements.join(', '));
  }

  getFocusedChild() {
    let currentFocus;
    const focusableChildren = this.getFocusableChildren();

    try {
      currentFocus = document.activeElement;
    } catch (err) {
      currentFocus = focusableChildren[0];
    }
    return currentFocus;
  }

  // not mouseUp because scrollbar fires it, shouldn't close when user scrolls
  handleBackdropClick(e) {
    if (e.target === this._mouseDownElement) {
      e.stopPropagation();
      if (!this.props.isOpen || this.props.backdrop !== true) return;

      const container = this._dialog;

      if (e.target && !container.contains(e.target) && this.props.toggle) {
        this.props.toggle(e);
      }
    }
  }

  handleTab(e) {
    if (e.which !== 9) return;

    const focusableChildren = this.getFocusableChildren();
    const totalFocusable = focusableChildren.length;
    const currentFocus = this.getFocusedChild();

    let focusedIndex = 0;

    for (let i = 0; i < totalFocusable; i += 1) {
      if (focusableChildren[i] === currentFocus) {
        focusedIndex = i;
        break;
      }
    }

    if (e.shiftKey && focusedIndex === 0) {
      e.preventDefault();
      focusableChildren[totalFocusable - 1].focus();
    } else if (!e.shiftKey && focusedIndex === totalFocusable - 1) {
      e.preventDefault();
      focusableChildren[0].focus();
    }
  }

  handleBackdropMouseDown(e) {
    this._mouseDownElement = e.target;
  }

  handleEscape(e) {
    if (this.props.isOpen && this.props.keyboard && e.keyCode === 27 && this.props.toggle) {
      this.props.toggle(e);
    }
  }

  init(container) {
    try {
      this._triggeringElement = document.activeElement;
    } catch (err) {
      this._triggeringElement = null;
    }

    const { zIndex, cssModule, containerClassName = '' } = this.props;

    this._element = container || document.createElement('div');
    this._element.setAttribute('tabindex', '-1');
    this._element.style.position = 'absolute';
    this._element.style.zIndex = zIndex;
    this._element.classList.add(...containerClassName.split(' '));
    this._originalBodyPadding = getOriginalBodyPadding();

    conditionallyUpdateScrollbar();

    if (!container) {
      document.body.appendChild(this._element);
    }

    if (Modal.openCount === 0) {
      document.body.className = classNames(document.body.className, mapToCssModules('modal-open', cssModule));
    }

    Modal.openCount += 1;
  }

  destroy() {
    if (this._element) {
      document.body.removeChild(this._element);
      this._element = null;
    }

    if (this._triggeringElement) {
      if (this._triggeringElement.focus) this._triggeringElement.focus();
      this._triggeringElement = null;
    }

    if (Modal.openCount <= 1) {
      const modalOpenClassName = mapToCssModules('modal-open', this.props.cssModule);
      // Use regex to prevent matching `modal-open` as part of a different class, e.g. `my-modal-opened`
      const modalOpenClassNameRegex = new RegExp(`(^| )${modalOpenClassName}( |$)`);
      document.body.className = document.body.className.replace(modalOpenClassNameRegex, ' ').trim();
    }
    Modal.openCount -= 1;

    setScrollbarWidth(this._originalBodyPadding);
  }

  renderModalDialog() {
    const attributes = omit(this.props, propsToOmit);
    const dialogBaseClass = 'modal-dialog';
    const { contentClassName, size, className, children, centered, cssModule, scrollable, getDialogRef, draggableProps } = this.props;

    return (
      <div
        {...attributes}
        className={mapToCssModules(
          classNames(dialogBaseClass, className, {
            [`modal-${size}`]: size,
            [`${dialogBaseClass}-centered`]: centered,
            [`${dialogBaseClass}-scrollable`]: scrollable
          }),
          cssModule
        )}
        role="document"
        ref={c => {
          this._dialog = c;
          typeof getDialogRef === 'function' && getDialogRef(c);
        }}
      >
        <Draggable {...draggableProps}>
          <div className={mapToCssModules(classNames('modal-content', contentClassName), cssModule)}>
            {children}

            {this.renderLoading()}
          </div>
        </Draggable>
      </div>
    );
  }

  renderLoading() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur className="modal-loading" />;
  }

  render() {
    if (this.state.isOpen) {
      const {
        wrapClassName,
        modalClassName,
        backdropClassName,
        cssModule,
        isOpen,
        backdrop,
        role,
        labelledBy,
        external,
        innerRef,
        isblurbackground
      } = this.props;

      const modalAttributes = {
        onClick: this.handleBackdropClick,
        onMouseDown: this.handleBackdropMouseDown,
        onKeyUp: this.handleEscape,
        onKeyDown: this.handleTab,
        style: { display: 'block' },
        'aria-labelledby': labelledBy,
        role,
        tabIndex: '-1'
      };

      const baseClass = isblurbackground ? 'ecos-modal_blur-bg' : '';
      const hasTransition = this.props.fade;
      const modalTransition = {
        ...Fade.defaultProps,
        ...this.props.modalTransition,
        baseClass: hasTransition ? this.props.modalTransition.baseClass : '',
        timeout: hasTransition ? this.props.modalTransition.timeout : 0
      };
      const backdropTransition = {
        ...Fade.defaultProps,
        ...this.props.backdropTransition,
        baseClass: hasTransition ? this.props.backdropTransition.baseClass : '',
        timeout: hasTransition ? this.props.backdropTransition.timeout : 0
      };

      const Backdrop = hasTransition ? (
        <Fade
          {...backdropTransition}
          in={isOpen && !!backdrop}
          cssModule={cssModule}
          className={mapToCssModules(classNames('modal-backdrop', backdropClassName), cssModule)}
        />
      ) : (
        <div className={mapToCssModules(classNames('modal-backdrop', 'show', backdropClassName), cssModule)} />
      );

      return (
        <Portal node={this._element}>
          <div className={mapToCssModules(wrapClassName)}>
            <Fade
              {...modalAttributes}
              {...modalTransition}
              baseClass={baseClass}
              in={isOpen}
              onEntered={this.onOpened}
              onExited={this.onClosed}
              cssModule={cssModule}
              className={mapToCssModules(classNames('modal', modalClassName), cssModule)}
              innerRef={innerRef}
            >
              {external}
              {this.renderModalDialog()}
            </Fade>
            {Backdrop}
          </div>
        </Portal>
      );
    }

    return null;
  }
}

Modal.propTypes = propTypes;
Modal.defaultProps = defaultProps;
Modal.openCount = 0;

export default Modal;
