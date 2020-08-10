import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash/debounce';

import { popupEmitter, Events } from './emitter';

import './style.scss';

export default class Popper extends Component {
  static propTypes = {
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

  componentDidMount() {
    this.checkNeedShowPopper();
  }

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
    const { text } = this.props;
    const element = this.#textRef;

    if (!element) {
      this.state.needPopover && this.setState({ needPopover: false });

      return;
    }

    if (!text) {
      return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const styles = window.getComputedStyle(element, null);
    const paddingLeft = parseInt(styles.getPropertyValue('padding-left'), 10) || 0;
    const paddingRight = parseInt(styles.getPropertyValue('padding-right'), 10) || 0;

    context.font = styles.getPropertyValue('font');

    let fullWidth = Math.round(context.measureText(text.trim()).width);
    let elementWidth = Math.round(element.getBoundingClientRect().width);

    if (isNaN(fullWidth)) {
      fullWidth = 0;
    }

    if (isNaN(elementWidth)) {
      elementWidth = 0;
    }

    const needPopover = fullWidth > elementWidth - (paddingLeft + paddingRight);

    this.setState({ needPopover });
  };

  setIconRef = ref => {
    if (ref) {
      this.#iconRef = ref;
    }
  };

  setTextRef = ref => {
    if (ref) {
      this.#textRef = ref;
      this.checkNeedShowPopper();
    }
  };

  handleMouseOut = () => {
    popupEmitter.emit(Events.HIDE);
  };

  handleMouseEnter = () => {
    const { text, contentComponent, icon } = this.props;
    const element = icon ? this.#iconRef : this.#textRef;

    popupEmitter.emit(Events.SHOW, element, contentComponent || text);
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

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className="ecos-popper">
          {this.renderText()}
          {this.renderIcon()}
        </div>
      </ReactResizeDetector>
    );
  }
}
