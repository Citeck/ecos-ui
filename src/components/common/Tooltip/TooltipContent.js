import classNames from 'classnames';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Popper as ReactPopper } from 'react-popper';
import Fade from 'reactstrap/lib/Fade';
import { DOMElement, getTarget, mapToCssModules, tagPropType, targetPropType } from 'reactstrap/lib/utils';

import ZIndex from '@/services/ZIndex';

export class TooltipContent extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: props.isOpen };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.isOpen && !state.isOpen) {
      return { isOpen: props.isOpen };
    } else return null;
  }

  getContainerNode = () => {
    return getTarget(this.props.container);
  };

  setTargetNode(node) {
    this.targetNode = typeof node === 'string' ? getTarget(node) : node;
  }

  renderChildren = () => {
    const {
      cssModule,
      children,
      isOpen,
      flip,
      target,
      offset,
      fallbackPlacement,
      placementPrefix,
      arrowClassName: _arrowClassName,
      hideArrow,
      popperClassName: _popperClassName,
      tag,
      container,
      modifiers,
      boundariesElement,
      onClosed,
      fade,
      transition,
      placement,
      ...attrs
    } = this.props;
    const arrowClassName = mapToCssModules(classNames('arrow', _arrowClassName), cssModule);
    const popperClassName = mapToCssModules(
      classNames(_popperClassName, placementPrefix ? `${placementPrefix}-auto` : ''),
      this.props.cssModule
    );

    const extendedModifiers = [
      {
        name: 'offset',
        options: { offset }
      },
      {
        name: 'flip',
        options: { enabled: flip, behavior: fallbackPlacement }
      },
      {
        name: 'preventOverflow',
        options: { boundary: boundariesElement }
      },
      ...modifiers
    ];

    const popperTransition = {
      ...Fade.defaultProps,
      ...transition,
      baseClass: fade ? transition.baseClass : '',
      timeout: fade ? transition.timeout : 0
    };

    let arrowMarginX = 0;
    const foundOffsetProps = modifiers.find(modifier => get(modifier, 'name') && modifier.name === 'offset');

    if (foundOffsetProps && get(foundOffsetProps, 'options.offset')) {
      const offset = foundOffsetProps.options.offset;

      switch (true) {
        case isNumber(offset):
          arrowMarginX = offset;
          break;

        case isArray(offset):
          arrowMarginX = get(offset, '[0]', 0);
          break;

        default:
          break;
      }
    }

    return (
      <Fade {...popperTransition} {...attrs} in={isOpen} onExited={this.onClosed} tag={tag}>
        <ReactPopper referenceElement={this.targetNode} modifiers={extendedModifiers} placement={placement}>
          {({ ref, style, placement, outOfBoundaries, arrowProps, scheduleUpdate }) => (
            <div
              ref={ref}
              style={style}
              className={popperClassName}
              // eslint-disable-next-line react/no-unknown-property
              x-placement={placement}
              // eslint-disable-next-line react/no-unknown-property
              x-out-of-boundaries={outOfBoundaries ? 'true' : undefined}
            >
              {typeof children === 'function' ? children({ scheduleUpdate }) : children}
              {!hideArrow && (
                <span
                  ref={arrowProps.ref}
                  className={arrowClassName}
                  style={{
                    ...arrowProps.style,
                    margin: `0 ${arrowMarginX}px`
                  }}
                />
              )}
            </div>
          )}
        </ReactPopper>
      </Fade>
    );
  };

  render() {
    this.setTargetNode(this.props.target);

    if (this.props.isOpen && !this.props.isHiddenTarget) {
      return this.props.container === 'inline'
        ? this.renderChildren()
        : ReactDOM.createPortal(
            <div ref={this.getRef} style={{ zIndex: ZIndex.calcZ() + 1, position: 'relative' }}>
              {this.renderChildren()}
            </div>,
            this.getContainerNode()
          );
    }

    return null;
  }
}

TooltipContent.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  popperClassName: PropTypes.string,
  isHiddenTarget: PropTypes.bool,
  placement: PropTypes.string,
  placementPrefix: PropTypes.string,
  arrowClassName: PropTypes.string,
  hideArrow: PropTypes.bool,
  tag: tagPropType,
  isOpen: PropTypes.bool.isRequired,
  cssModule: PropTypes.object,
  offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fallbackPlacement: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  flip: PropTypes.bool,
  container: targetPropType,
  target: targetPropType.isRequired,
  modifiers: PropTypes.arrayOf(PropTypes.object),
  boundariesElement: PropTypes.oneOfType([PropTypes.string, DOMElement]),
  onClosed: PropTypes.func,
  fade: PropTypes.bool,
  transition: PropTypes.shape(Fade.propTypes)
};

TooltipContent.defaultProps = {
  boundariesElement: 'viewport',
  placement: 'auto',
  hideArrow: false,
  isOpen: false,
  offset: 0,
  fallbackPlacement: 'flip',
  flip: true,
  container: 'body',
  modifiers: {},
  onClosed: () => {},
  fade: true,
  transition: {
    ...Fade.defaultProps
  }
};
