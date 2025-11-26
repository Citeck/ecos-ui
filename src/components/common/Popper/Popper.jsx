import classNames from 'classnames';
import debounce from 'lodash/debounce';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';

import { Events, popupEmitter } from './emitter';

import { getFirstNotNil } from '@/helpers/util';

import './style.scss';

export default class Popper extends Component {
  static propTypes = {
    className: PropTypes.string,
    popupClassName: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string,
    showAsNeeded: PropTypes.bool,
    uncontrolled: PropTypes.bool,
    autohide: PropTypes.bool,
    isOpen: PropTypes.bool,
    isViewNewJournal: PropTypes.bool,
    withoutText: PropTypes.bool,
    contentComponent: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    placement: PropTypes.oneOf([
      'auto',
      'auto-start',
      'auto-end',
      'top',
      'top-start',
      'top-end',
      'right',
      'right-start',
      'right-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'left',
      'left-start',
      'left-end'
    ])
  };

  static defaultProps = {
    showAsNeeded: false,
    uncontrolled: true
  };

  #iconRef = null;
  #textRef = null;

  state = {
    needPopover: false
  };

  componentWillUnmount() {
    this.handleResize.cancel();
    popupEmitter.emit(Events.HIDE);
  }

  get needPopper() {
    const { text, contentComponent, withoutText, off } = this.props;

    if (off) {
      return false;
    }

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

  handleMouseOut = e => {
    const { uncontrolled, isOpen, autohide } = this.props;

    const relatedTarget = e.relatedTarget;
    const currentTarget = e.currentTarget;

    if (currentTarget.contains(relatedTarget)) {
      return;
    }

    if ((!uncontrolled && !isOpen) || uncontrolled || autohide) {
      popupEmitter.emit(Events.HIDE);
    }
  };

  handleMouseEnter = () => {
    const { text, contentComponent, icon, popupClassName, isViewNewJournal, placement, uncontrolled, isOpen } = this.props;
    const element = icon && !isViewNewJournal ? this.#iconRef : this.#textRef;
    element && element.classList.add('ecosZIndexAnchor');

    if (uncontrolled || (!uncontrolled && isOpen)) {
      popupEmitter.emit(
        Events.SHOW,
        element,
        this.getDisp(getFirstNotNil(contentComponent, text)),
        classNames(popupClassName, {
          'ecos-popper__text_new': isViewNewJournal
        }),
        placement
      );
    }
  };

  handleResize = debounce(() => this.checkNeedShowPopper(), 350);

  renderText = () => {
    const { icon, text, contentComponent, children, withoutText, isViewNewJournal } = this.props;

    if (withoutText) {
      return null;
    }

    const extraProps = {};

    if ((!icon && this.canShowPopover) || (isViewNewJournal && this.canShowPopover)) {
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
    const { icon, isViewNewJournal } = this.props;

    if (!icon || !this.canShowPopover || isViewNewJournal) {
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
