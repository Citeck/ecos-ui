import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DOMElement, getTarget, mapToCssModules, omit, PopperPlacements, targetPropType } from 'reactstrap/lib/utils';

import { TooltipContent } from './TooltipContent';

const DEFAULT_DELAYS = {
  show: 0,
  hide: 50
};

function isInDOMSubtree(element, subtreeRoot) {
  return subtreeRoot && (element === subtreeRoot || subtreeRoot.contains(element));
}

function isInDOMSubtrees(element, subtreeRoots = []) {
  return subtreeRoots && subtreeRoots.length && subtreeRoots.filter(subTreeRoot => isInDOMSubtree(element, subTreeRoot))[0];
}

/**
 * Tooltips whose target is not in the document yet. The listeners are bound to whatever the target
 * id resolves to when the tooltip mounts, so a child that renders nothing until its data arrives —
 * the journal's `Import` button, for one — would never get them and the button would stay silent on
 * hover for the rest of the page's life (COREDEV-408).
 *
 * One observer serves all of them, so the cost does not grow with the number of tooltips on a page,
 * and it only runs while somebody is actually waiting for a target.
 */
const waitingForTarget = new Set();
let targetObserver = null;

function watchForTarget(tooltip) {
  if (typeof MutationObserver === 'undefined' || !document.body) {
    return;
  }

  waitingForTarget.add(tooltip);

  if (!targetObserver) {
    targetObserver = new MutationObserver(records => {
      if (records.some(record => record.addedNodes.length)) {
        Array.from(waitingForTarget).forEach(item => item.updateTarget());
      }
    });
    targetObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function unwatchForTarget(tooltip) {
  waitingForTarget.delete(tooltip);

  if (targetObserver && !waitingForTarget.size) {
    targetObserver.disconnect();
    targetObserver = null;
  }
}

export const propsTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  placement: PropTypes.oneOf(PopperPlacements),
  target: targetPropType.isRequired,
  container: targetPropType,
  isOpen: PropTypes.bool,
  disabled: PropTypes.bool,
  hideArrow: PropTypes.bool,
  boundariesElement: PropTypes.oneOfType([PropTypes.string, DOMElement]),
  className: PropTypes.string,
  innerClassName: PropTypes.string,
  arrowClassName: PropTypes.string,
  popperClassName: PropTypes.string,
  cssModule: PropTypes.object,
  toggle: PropTypes.func,
  autohide: PropTypes.bool,
  isHiddenTarget: PropTypes.bool,
  placementPrefix: PropTypes.string,
  delay: PropTypes.oneOfType([PropTypes.shape({ show: PropTypes.number, hide: PropTypes.number }), PropTypes.number]),
  modifiers: PropTypes.arrayOf(PropTypes.object),
  offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.string, PropTypes.object]),
  trigger: PropTypes.string,
  fade: PropTypes.bool,
  flip: PropTypes.bool,
  needTooltip: PropTypes.bool
};

export class TooltipWrapper extends Component {
  constructor(props) {
    super(props);

    this._targets = [];
    this.currentTargetElement = null;
    this.addTargetEvents = this.addTargetEvents.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.removeTargetEvents = this.removeTargetEvents.bind(this);
    this.toggle = this.toggle.bind(this);
    this.showWithDelay = this.showWithDelay.bind(this);
    this.hideWithDelay = this.hideWithDelay.bind(this);
    this.onMouseOverTooltipContent = this.onMouseOverTooltipContent.bind(this);
    this.onMouseLeaveTooltipContent = this.onMouseLeaveTooltipContent.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.onEscKeyDown = this.onEscKeyDown.bind(this);
    this.getRef = this.getRef.bind(this);
    this.state = { isOpen: props.isOpen };
    this._isMounted = false;
    // The state we last asked the owner for. `props.isOpen` only catches up once React has
    // committed that request, and on a loaded page the pointer can leave the target well
    // before that happens — guarding on the prop alone drops the hide and the tooltip stays
    // on screen forever (COREDEV-356).
    this._requestedOpen = props.isOpen;
  }

  componentDidMount() {
    this._isMounted = true;
    this.updateTarget();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isOpen !== this.props.isOpen) {
      this._requestedOpen = this.props.isOpen;
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    unwatchForTarget(this);
    this.removeTargetEvents();
    this._targets = null;
    this.clearShowTimeout();
    this.clearHideTimeout();
  }

  static getDerivedStateFromProps(props, state) {
    if (props.isOpen && !state.isOpen) {
      return { isOpen: props.isOpen };
    } else return null;
  }

  onMouseOverTooltipContent() {
    if (this.props.trigger.indexOf('hover') > -1 && !this.props.autohide) {
      if (this._hideTimeout) {
        this.clearHideTimeout();
      }
      if (this.state.isOpen && !this.props.isOpen) {
        this.toggle(undefined, true);
      }
    }
  }

  onMouseLeaveTooltipContent(e) {
    if (this.props.trigger.indexOf('hover') > -1 && !this.props.autohide) {
      if (this._showTimeout) {
        this.clearShowTimeout();
      }
      e.persist();
      this._hideTimeout = setTimeout(this.hide.bind(this, e), this.getDelay('hide'));
    }
  }

  onEscKeyDown(e) {
    if (e.key === 'Escape') {
      this.hide(e);
    }
  }

  getRef(ref) {
    const { innerRef } = this.props;
    if (innerRef) {
      if (typeof innerRef === 'function') {
        innerRef(ref);
      } else if (typeof innerRef === 'object') {
        innerRef.current = ref;
      }
    }
    this._popover = ref;
  }

  getDelay(key) {
    const { delay } = this.props;
    if (typeof delay === 'object') {
      return isNaN(delay[key]) ? DEFAULT_DELAYS[key] : delay[key];
    }
    return delay;
  }

  show(e) {
    if (!this._requestedOpen && this.props.needTooltip) {
      this.clearShowTimeout();
      this.currentTargetElement = e ? e.currentTarget || e.target : null;
      if (e && e.composedPath && typeof e.composedPath === 'function') {
        const path = e.composedPath();
        this.currentTargetElement = (path && path[0]) || this.currentTargetElement;
      }
      this.toggle(e, true);
    }
  }

  showWithDelay(e) {
    if (this._hideTimeout) {
      this.clearHideTimeout();
    }
    this._showTimeout = setTimeout(this.show.bind(this, e), this.getDelay('show'));
  }
  hide(e) {
    if (this._requestedOpen) {
      this.clearHideTimeout();
      this.currentTargetElement = null;
      this.toggle(e, false);
    }
  }

  hideWithDelay(e) {
    if (this._showTimeout) {
      this.clearShowTimeout();
    }
    this._hideTimeout = setTimeout(this.hide.bind(this, e), this.getDelay('hide'));
  }

  clearShowTimeout() {
    clearTimeout(this._showTimeout);
    this._showTimeout = undefined;
  }

  clearHideTimeout() {
    clearTimeout(this._hideTimeout);
    this._hideTimeout = undefined;
  }

  handleDocumentClick(e) {
    const triggers = this.props.trigger.split(' ');

    if (triggers.indexOf('legacy') > -1 && (this.props.isOpen || isInDOMSubtrees(e.target, this._targets))) {
      if (this._hideTimeout) {
        this.clearHideTimeout();
      }
      if (this.props.isOpen && !isInDOMSubtree(e.target, this._popover)) {
        this.hideWithDelay(e);
      } else if (!this.props.isOpen) {
        this.showWithDelay(e);
      }
    } else if (triggers.indexOf('click') > -1 && isInDOMSubtrees(e.target, this._targets)) {
      if (this._hideTimeout) {
        this.clearHideTimeout();
      }

      if (!this.props.isOpen) {
        this.showWithDelay(e);
      } else {
        this.hideWithDelay(e);
      }
    }
  }

  addEventOnTargets(type, handler, isBubble) {
    this._targets.forEach(target => {
      target.addEventListener(type, handler, isBubble);
    });
  }

  removeEventOnTargets(type, handler, isBubble) {
    this._targets.forEach(target => {
      target.removeEventListener(type, handler, isBubble);
    });
  }

  addTargetEvents() {
    if (this.props.trigger) {
      let triggers = this.props.trigger.split(' ');
      if (triggers.indexOf('manual') === -1) {
        if (triggers.indexOf('click') > -1 || triggers.indexOf('legacy') > -1) {
          document.addEventListener('click', this.handleDocumentClick, true);
        }

        if (this._targets && this._targets.length) {
          if (triggers.indexOf('hover') > -1) {
            this.addEventOnTargets('mouseover', this.showWithDelay, true);
            this.addEventOnTargets('mouseout', this.hideWithDelay, true);
          }
          if (triggers.indexOf('focus') > -1) {
            this.addEventOnTargets('focusin', this.show, true);
            this.addEventOnTargets('focusout', this.hide, true);
          }
          this.addEventOnTargets('keydown', this.onEscKeyDown, true);
        }
      }
    }
  }

  removeTargetEvents() {
    if (this._targets) {
      this.removeEventOnTargets('mouseover', this.showWithDelay, true);
      this.removeEventOnTargets('mouseout', this.hideWithDelay, true);
      this.removeEventOnTargets('keydown', this.onEscKeyDown, true);
      this.removeEventOnTargets('focusin', this.show, true);
      this.removeEventOnTargets('focusout', this.hide, true);
    }

    document.removeEventListener('click', this.handleDocumentClick, true);
  }

  updateTarget() {
    let newTarget;
    try {
      newTarget = getTarget(this.props.target, true);
    } catch (_err) {
      newTarget = [];
    }

    // `getTarget` hands back a NodeList, which never compares equal to the array kept here — so the
    // elements are compared instead, or every call would rebind the listeners
    const targets = newTarget ? Array.from(newTarget) : [];

    if (!isEqual(targets, this._targets)) {
      this.removeTargetEvents();
      this._targets = targets;
      this.currentTargetElement = this.currentTargetElement || this._targets[0];
      this.addTargetEvents();
    }

    if (this._targets.length) {
      unwatchForTarget(this);
    } else {
      watchForTarget(this);
    }
  }

  /**
   * @param e - the event that caused the change, may be absent
   * @param nextOpen - the state being asked for; omitted means "flip whatever is current"
   */
  toggle(e, nextOpen) {
    if (this.props.disabled || !this._isMounted) {
      return e && e.preventDefault();
    }

    if (typeof nextOpen === 'boolean') {
      this._requestedOpen = nextOpen;
    }

    return this.props.toggle(e, nextOpen);
  }

  render() {
    if (!this.props.isOpen || this.props.isHiddenTarget) {
      return null;
    }

    this.updateTarget();

    const {
      className,
      cssModule,
      innerClassName,
      isOpen,
      hideArrow,
      boundariesElement,
      isHiddenTarget,
      placement,
      placementPrefix,
      arrowClassName,
      popperClassName,
      container,
      modifiers,
      offset,
      fade,
      flip,
      children
    } = this.props;

    const attributes = omit(this.props, Object.keys(propsTypes));
    const popperClasses = mapToCssModules(popperClassName, cssModule);
    const classes = mapToCssModules(innerClassName, cssModule);

    return (
      <TooltipContent
        className={className}
        target={this.currentTargetElement || this._targets[0]}
        isOpen={isOpen}
        isHiddenTarget={isHiddenTarget}
        hideArrow={hideArrow}
        boundariesElement={boundariesElement}
        placement={placement}
        placementPrefix={placementPrefix}
        arrowClassName={arrowClassName}
        popperClassName={popperClasses}
        container={container}
        modifiers={modifiers}
        offset={offset}
        cssModule={cssModule}
        fade={fade}
        flip={flip}
      >
        {({ scheduleUpdate }) => (
          <div
            {...attributes}
            ref={this.getRef}
            className={classes}
            role="tooltip"
            onMouseOver={this.onMouseOverTooltipContent}
            onMouseLeave={this.onMouseLeaveTooltipContent}
            onKeyDown={this.onEscKeyDown}
          >
            {typeof children === 'function' ? children({ scheduleUpdate }) : children}
          </div>
        )}
      </TooltipContent>
    );
  }
}

TooltipWrapper.propTypes = propsTypes;

TooltipWrapper.defaultProps = {
  isOpen: false,
  hideArrow: false,
  autohide: false,
  delay: DEFAULT_DELAYS,
  toggle: function () {},
  trigger: 'click',
  fade: true
};
