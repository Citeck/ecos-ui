import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip as RTooltip } from 'reactstrap';
import classNames from 'classnames';
import get from 'lodash/get';

class Tooltip extends Component {
  static propTypes = {
    target: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
    autohide: PropTypes.bool,
    uncontrolled: PropTypes.bool,
    hideArrow: PropTypes.bool,
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
    trigger: PropTypes.oneOf(['hover', 'focus']),
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
    text: '',
    delay: 0,
    placement: 'top',
    trigger: 'hover',
    boundariesElement: 'window',
    onToggle: () => null
  };

  constructor(props) {
    super(props);

    this._componentRef = React.createRef();
    this.state = {
      isOpen: false
    };
  }

  onToggle = () => {
    this.setState(state => ({ isOpen: !state.isOpen }));
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
      autohide,
      delay,
      uncontrolled,
      modifiers,
      offset,
      innerRef,
      onToggle
    } = this.props;

    return {
      target,
      placement,
      boundariesElement,
      trigger,
      autohide,
      innerRef,
      delay,
      modifiers,
      offset,
      className: classNames('ecos-base-tooltip', className),
      innerClassName: classNames('ecos-base-tooltip-inner', innerClassName),
      arrowClassName: classNames('ecos-base-tooltip-arrow', arrowClassName),
      toggle: uncontrolled ? this.onToggle : onToggle
    };
  };

  renderTooltip = () => {
    const { text, bySize, target } = this.props;
    const { isOpen } = this.state;
    const element = document.querySelector(`#${target}`);
    let needTooltip = false;

    if (element) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const styles = window.getComputedStyle(element, null);
      const paddingLeft = parseInt(styles.getPropertyValue('padding-left'), 10) || 0;
      const paddingRight = parseInt(styles.getPropertyValue('padding-right'), 10) || 0;

      context.font = styles.getPropertyValue('font');
      needTooltip = context.measureText(text).width > element.getBoundingClientRect().width - (paddingLeft + paddingRight);
    }

    return (
      <RTooltip {...this.tooltipProps()} isOpen={bySize && needTooltip && isOpen}>
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
