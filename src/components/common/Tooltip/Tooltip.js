import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip, Tooltip } from 'reactstrap';
import classNames from 'classnames';
import get from 'lodash/get';

class CustomTooltip extends Component {
  static propTypes = {
    uncontrolled: PropTypes.bool,
    ForComponent: PropTypes.element,
    text: PropTypes.string,
    placement: PropTypes.string, // todo: one of
    boundariesElement: PropTypes.string,
    className: PropTypes.string,
    innerClassName: PropTypes.string,
    arrowClassName: PropTypes.string,
    target: PropTypes.string.isRequired
  };

  static defaultProps = {
    uncontrolled: false,
    ForComponent: () => null,
    text: '',
    placement: 'top',
    boundariesElement: 'window'
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
    const { target, placement, boundariesElement, className, innerClassName, arrowClassName, uncontrolled } = this.props;
    const { isOpen } = this.state;

    const props = {
      target,
      placement,
      boundariesElement,
      className: classNames('ecos-base-tooltip', className),
      innerClassName: classNames('ecos-base-tooltip-inner', innerClassName),
      arrowClassName: classNames('ecos-base-tooltip-arrow', arrowClassName),
      toggle: this.onToggle
      // isOpen
    };

    if (uncontrolled) {
      props.trigger = 'hover';
      props.autohide = false;
    }

    return props;
  };

  renderTooltip = () => {
    const { text, bySize, target } = this.props;
    const { isOpen } = this.state;
    const element = get(this._componentRef, 'current', null);
    let needTooltip = false;
    const el = document.querySelector(`#${target}`);

    // if (element) {
    //   const c = document.createElement('canvas');
    //   const ctx = c.getContext('2d');
    //
    //   needTooltip = ctx.measureText(text).width > element.getBoundingClientRect().width;
    //
    //   console.warn(needTooltip, ctx.measureText(text).width, element.getBoundingClientRect().width)
    // }

    if (el) {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const paddingLeft = parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-left'), 10) || 0;
      const paddingRight = parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-right'), 10) || 0;
      const padding = paddingLeft + paddingRight;

      ctx.font = window.getComputedStyle(el, null).getPropertyValue('font');
      needTooltip = ctx.measureText(text).width > el.getBoundingClientRect().width - padding;
    }

    return (
      <Tooltip
        {...this.tooltipProps()}
        // target={target}
        isOpen={bySize && needTooltip && isOpen}
        // placement="top"
        // trigger="hover"
        // delay={250}
        // autohide={false}
        // toggle={this.onToggle.bind(this)}
        // boundariesElement="window"
        // className="ecos-base-tooltip"
        // innerClassName="ecos-base-tooltip-inner"
        // arrowClassName="ecos-base-tooltip-arrow"
      >
        {text}
      </Tooltip>
    );
  };

  render() {
    const { uncontrolled } = this.props;

    if (uncontrolled) {
      // const Element = React.cloneElement(this.props.children, { id: target, ref: this._componentRef });

      return (
        <>
          {/*<div ref={this._componentRef} id={target}>Событие mouseleave срабатывает, когда курсор манипулятора (обычно мыши) перемещается за границы элемента.</div>*/}
          {/*<Element*/}
          {/*  // id={target}*/}
          {/*  // ref={this._componentRef}*/}
          {/*  // onMouseOver={() => {*/}
          {/*  //   if (this.state.isOpen) {*/}
          {/*  //     return;*/}
          {/*  //   }*/}
          {/*  //*/}
          {/*  //   this.setState({ isOpen: true });*/}
          {/*  // }}*/}
          {/*/>*/}
          {this.renderTooltip()}
        </>
      );
    }

    return <div />;
  }
}

export default CustomTooltip;
