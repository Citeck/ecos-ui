import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash/debounce';
import isNil from 'lodash/isNil';

import { getFirstNotNil } from '../../../helpers/util';
import { Events, popupEmitter } from './emitter';

import './style.scss';

export default class Popper extends Component {
  static propTypes = {
    className: PropTypes.string,
    popupClassName: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string,
    showAsNeeded: PropTypes.bool,
    withoutText: PropTypes.bool,
    contentComponent: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
  };

  static defaultProps = {
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
    const { text, contentComponent, withoutText } = this.props;

    if (withoutText) {
      return !isNil(contentComponent);
    }

    return !isNil(getFirstNotNil(text, contentComponent));
  }

  get canShowPopover() {
    const { showAsNeeded } = this.props;
    const { needPopover } = this.state;

    if (showAsNeeded) {
      return needPopover;
    }

    return true;
  }

  getDisp = val => (isNil(val) ? '' : val);

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

      if (!ref || !this.needPopper) {
        this.state.needPopover && this.setState({ needPopover: false });
        return;
      }

      this.setState({
        needPopover: 0 > ref.clientWidth - ref.scrollWidth
      });
    }
  };

  handleMouseOut = () => {
    popupEmitter.emit(Events.HIDE);
  };

  handleMouseEnter = () => {
    const { text, contentComponent, icon, popupClassName } = this.props;
    const element = icon ? this.#iconRef : this.#textRef;
    element && element.classList.add('ecosZIndexAnchor');

    popupEmitter.emit(Events.SHOW, element, this.getDisp(getFirstNotNil(contentComponent, text)), popupClassName);
  };

  handleResize = debounce(() => this.checkNeedShowPopper(), 350);

  renderText = () => {
    const { icon, text, contentComponent, children, withoutText } = this.props;

    if (withoutText) {
      return null;
    }

    const extraProps = {};

    if (!icon && this.canShowPopover) {
      extraProps.onMouseEnter = this.handleMouseEnter;
      extraProps.onMouseOut = this.handleMouseOut;
    }

    return (
      <div ref={this.setTextRef} className="ecos-popper__text" {...extraProps}>
        {this.getDisp(getFirstNotNil(children, text, contentComponent))}
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

    const { className, onClick } = this.props;

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className={classNames('ecos-popper', className)} onClick={onClick}>
          {this.renderText()}
          {this.renderIcon()}
        </div>
      </ReactResizeDetector>
    );
  }
}
