import classNames from 'classnames';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { TooltipWrapper } from './TooltipWrapper';

import { isClosestHidden } from '@/helpers/util';
import './style.scss';

export const baseModifiers = [
  {
    name: 'offset',
    enabled: true,
    options: {
      offset: [0, 5]
    }
  }
];
export const baseDelay = { show: 250, hide: 0 };

class Tooltip extends Component {
  /**
   * @param children - The element to which the tooltip is attached
   * @param showAsNeeded - To display the tooltip only when the text does not fit into the child-element
   * @param uncontrolled - Used to set the trigger to “hover” if “uncontrolled” to “false” or to “click” otherwise
   */
  static propTypes = {
    target: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
    contentComponent: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node, PropTypes.string]),
    autohide: PropTypes.bool,
    hideArrow: PropTypes.bool,
    isOpen: PropTypes.bool,
    uncontrolled: PropTypes.bool,
    showAsNeeded: PropTypes.bool,
    getIsNeeded: PropTypes.func,
    minWidthByContent: PropTypes.bool,
    off: PropTypes.bool,
    text: PropTypes.string,
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
    ]),
    modifiers: PropTypes.arrayOf(PropTypes.object),
    delay: PropTypes.oneOfType([PropTypes.shape({ show: PropTypes.number, hide: PropTypes.number }), PropTypes.number]),
    offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.string, PropTypes.object]),
    trigger: PropTypes.oneOf(['hover', 'focus', 'click']),
    boundariesElement: PropTypes.string,
    className: PropTypes.string,
    innerClassName: PropTypes.string,
    arrowClassName: PropTypes.string,
    popperClassName: PropTypes.string,
    onToggle: PropTypes.func
  };

  static defaultProps = {
    autohide: false,
    hideArrow: false,
    uncontrolled: false,
    isOpen: false,
    minWidthByContent: false,
    text: '',
    delay: 0,
    placement: 'top',
    boundariesElement: 'window',
    modifiers: baseModifiers
  };

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (isFunction(props.onToggle) && props.isOpen !== state.isOpen && !props.uncontrolled) {
      newState.isOpen = props.isOpen;
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isOpen,
      isHiddenTarget: true
    };
  }

  componentDidMount() {
    this.stealthCheck();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.stealthCheck();
  }

  stealthCheck = () => {
    const isHiddenTarget = isClosestHidden(`#${this.props.target}`);

    if (isHiddenTarget !== this.state.isHiddenTarget) {
      this.setState({ isHiddenTarget });
    }
  };

  /**
   * @param data - [event, nextOpen]; the wrapper states which way it wants to go, so a
   * request that arrives before the previous one is committed cannot cancel it out
   * by flipping the flag twice (COREDEV-356).
   */
  onToggle = (...data) => {
    const { onToggle, uncontrolled } = this.props;
    const nextOpen = data[1];

    if (isFunction(onToggle) && !uncontrolled) {
      onToggle.call(this, ...data);
    } else if (typeof nextOpen === 'boolean') {
      this.setState({ isOpen: nextOpen });
    } else {
      this.setState(state => ({ isOpen: !state.isOpen }));
    }
  };

  runUpdate = () => {
    this.forceUpdate();
  };

  tooltipProps = () => {
    const {
      target,
      placement,
      boundariesElement,
      className,
      innerClassName,
      arrowClassName,
      popperClassName,
      trigger,
      uncontrolled,
      autohide,
      delay,
      modifiers: _modifiers,
      offset,
      innerRef,
      hideArrow,
      container,
      contentComponent
    } = this.props;

    const modifiers = isArray(_modifiers) ? _modifiers : [_modifiers];

    const targetElement = typeof target === 'string' ? document.getElementById(target) : null;
    const isInModal = !!(targetElement && targetElement.closest('.modal'));
    const effectiveTrigger = uncontrolled ? trigger || 'hover' : trigger || 'click';
    // Текстовый hover-тултип не должен перехватывать курсор: иначе он появляется под ним,
    // ловит mouseleave цели и мерцает (см. «добавить связь» в виджете «Связи»)
    const isHoverOnly = String(effectiveTrigger).includes('hover') && !contentComponent;

    return {
      target,
      placement,
      boundariesElement,
      trigger: effectiveTrigger,
      autohide,
      innerRef,
      delay,
      modifiers,
      offset,
      container,
      hideArrow,
      className: classNames(
        'ecos-base-tooltip',
        { 'ecos-modal-tooltip': isInModal, 'ecos-base-tooltip_hover': isHoverOnly },
        className
      ),
      innerClassName: classNames('ecos-base-tooltip-inner ecos-base-tooltip-inner_new', innerClassName),
      arrowClassName: classNames('ecos-base-tooltip-arrow', arrowClassName),
      popperClassName: classNames('ecos-base-tooltip-popper', popperClassName),
      toggle: this.onToggle
    };
  };

  renderTooltip = () => {
    const { text, showAsNeeded, target, elementId, minWidthByContent, contentComponent, getIsNeeded } = this.props;
    const { isOpen, isHiddenTarget } = this.state;
    const element = document.getElementById(elementId || target);
    const styles = {};
    let needTooltip = !showAsNeeded;

    if (showAsNeeded && element && element.clientWidth && element.clientHeight && !isHiddenTarget) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const computedStyles = window.getComputedStyle(element, null);
      const paddingLeft = parseInt(computedStyles.getPropertyValue('padding-left'), 10) || 0;
      const paddingRight = parseInt(computedStyles.getPropertyValue('padding-right'), 10) || 0;
      const { width, height } = element.getBoundingClientRect();

      context.font = computedStyles.getPropertyValue('font');

      if (!isNil(width) && !isNil(height)) {
        needTooltip = context.measureText(text).width > width - (paddingLeft + paddingRight);
      }

      getIsNeeded && getIsNeeded(needTooltip);
    }

    // The element is gone whenever the target left the document between renders — a tab closed or
    // dragged away — and `getComputedStyle(null)` throws, taking the whole render with it.
    if (minWidthByContent && !isHiddenTarget && element) {
      styles.minWidth = parseInt(window.getComputedStyle(element, null).getPropertyValue('width'), 10) || 0;
    }

    const propsTooltip = this.tooltipProps();

    const popperClasses = classNames('tooltip', 'show', propsTooltip.popperClassName);

    const classes = classNames('tooltip-inner', propsTooltip.innerClassName);

    propsTooltip.popperClassName = popperClasses;
    propsTooltip.innerClassName = classes;

    return (
      <TooltipWrapper {...propsTooltip} isOpen={isOpen} isHiddenTarget={isHiddenTarget} style={styles} needTooltip={needTooltip}>
        {contentComponent || text}
      </TooltipWrapper>
    );
  };

  render() {
    return (
      <>
        {this.props.children}
        {!this.props.off && this.renderTooltip()}
      </>
    );
  }
}

export default Tooltip;
