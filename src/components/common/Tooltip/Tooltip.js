import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip as RTooltip } from 'reactstrap';
import classNames from 'classnames';

import './style.scss';

class Tooltip extends Component {
  /**
   * @param children - The element to which the tooltip is attached
   * @param showAsNeeded - To display the tooltip only when the text does not fit into the child-element
   * @param uncontrolled - Used to set the trigger to “hover” if “uncontrolled” to “false” or to “click” otherwise
   */
  static propTypes = {
    target: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
    autohide: PropTypes.bool,
    hideArrow: PropTypes.bool,
    isOpen: PropTypes.bool,
    uncontrolled: PropTypes.bool,
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
    modifiers: PropTypes.object,
    delay: PropTypes.oneOfType([PropTypes.shape({ show: PropTypes.number, hide: PropTypes.number }), PropTypes.number]),
    offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.string, PropTypes.object]),
    trigger: PropTypes.oneOf(['hover', 'focus', 'click']),
    boundariesElement: PropTypes.string,
    className: PropTypes.string,
    innerClassName: PropTypes.string,
    arrowClassName: PropTypes.string,
    onToggle: PropTypes.func
  };

  static defaultProps = {
    autohide: false,
    hideArrow: false,
    uncontrolled: false,
    isOpen: false,
    text: '',
    delay: 0,
    placement: 'top',
    boundariesElement: 'window'
  };

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (typeof props.onToggle === 'function' && props.isOpen !== state.isOpen && !props.uncontrolled) {
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
      isOpen: props.isOpen
    };
  }

  onToggle = () => {
    const { onToggle, uncontrolled } = this.props;

    if (typeof onToggle === 'function' && !uncontrolled) {
      onToggle.call(this);
    } else {
      this.setState(state => ({ isOpen: !state.isOpen }));
    }
  };

  tooltipProps = () => {
    const {
      target,
      placement,
      boundariesElement,
      className,
      innerClassName,
      arrowClassName,
      trigger,
      uncontrolled,
      autohide,
      delay,
      modifiers,
      offset,
      innerRef
    } = this.props;

    return {
      target,
      placement,
      boundariesElement,
      trigger: uncontrolled ? (!trigger ? 'hover' : trigger) : 'click',
      autohide,
      innerRef,
      delay,
      modifiers,
      offset,
      className: classNames('ecos-base-tooltip', className),
      innerClassName: classNames('ecos-base-tooltip-inner', innerClassName),
      arrowClassName: classNames('ecos-base-tooltip-arrow', arrowClassName),
      toggle: this.onToggle
    };
  };

  renderTooltip = () => {
    const { text, showAsNeeded, target } = this.props;
    const { isOpen } = this.state;
    const element = document.getElementById(target);
    let needTooltip = !showAsNeeded;

    if (showAsNeeded && element) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const styles = window.getComputedStyle(element, null);
      const paddingLeft = parseInt(styles.getPropertyValue('padding-left'), 10) || 0;
      const paddingRight = parseInt(styles.getPropertyValue('padding-right'), 10) || 0;

      context.font = styles.getPropertyValue('font');
      needTooltip = context.measureText(text).width > element.getBoundingClientRect().width - (paddingLeft + paddingRight);
    }

    return (
      <RTooltip {...this.tooltipProps()} isOpen={needTooltip && isOpen}>
        {text}
      </RTooltip>
    );
  };

  render() {
    return (
      <>
        {this.props.children}
        {this.renderTooltip()}
      </>
    );
  }
}

export default Tooltip;
