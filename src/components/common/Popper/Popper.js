import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash/debounce';

import { popupEmitter, Events } from './emitter';

import './style.scss';

export default class Popper extends Component {
  static propTypes = {
    className: PropTypes.string,
    popupClassName: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string,
    showAsNeeded: PropTypes.bool,
    contentComponent: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
  };

  static defaultProps = {
    text: '',
    showAsNeeded: false
  };

  #iconRef = null;
  #textRef = null;

  state = {
    needPopover: false
  };

  componentWillUnmount() {
    this.handleResize.cancel();
  }

  get needPopper() {
    const { text, contentComponent } = this.props;

    return text || contentComponent;
  }

  get canShowPopover() {
    const { showAsNeeded } = this.props;
    const { needPopover } = this.state;

    if (showAsNeeded) {
      return needPopover;
    }

    return true;
  }

  checkNeedShowPopper = () => {
    const element = this.#textRef;

    if (!element || !this.needPopper) {
      this.state.needPopover && this.setState({ needPopover: false });

      return;
    }

    this.setState({
      needPopover: 0 > element.clientWidth - element.scrollWidth
    });
  };

  setIconRef = ref => {
    if (ref) {
      this.#iconRef = ref;
    }
  };

  setTextRef = ref => {
    if (ref) {
      this.#textRef = ref;
      setTimeout(this.checkNeedShowPopper, 0);
    }
  };

  handleMouseOut = () => {
    popupEmitter.emit(Events.HIDE);
  };

  handleMouseEnter = () => {
    const { text, contentComponent, icon, popupClassName } = this.props;
    const element = icon ? this.#iconRef : this.#textRef;

    popupEmitter.emit(Events.SHOW, element, contentComponent || text, popupClassName);
  };

  handleResize = debounce(() => {
    this.checkNeedShowPopper();
  }, 350);

  renderText = () => {
    const { icon, text, contentComponent, children } = this.props;
    const extraProps = {};

    if (!icon && this.canShowPopover) {
      extraProps.onMouseEnter = this.handleMouseEnter;
      extraProps.onMouseOut = this.handleMouseOut;
    }

    return (
      <div ref={this.setTextRef} className="ecos-popper__text" {...extraProps}>
        {children || text || contentComponent}
      </div>
    );
  };

  renderIcon() {
    const { icon } = this.props;

    if (!icon || !this.canShowPopover) {
      return null;
    }

    return (
      <i
        ref={this.setIconRef}
        className={classNames('icon', icon, 'ecos-popper__icon')}
        onMouseEnter={this.handleMouseEnter}
        onMouseOut={this.handleMouseOut}
      />
    );
  }

  render() {
    if (!this.needPopper) {
      return null;
    }

    const { className } = this.props;

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className={classNames('ecos-popper', className)}>
          {this.renderText()}
          {this.renderIcon()}
        </div>
      </ReactResizeDetector>
    );
  }
}
