import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DOMElement, getTarget, mapToCssModules, omit, PopperPlacements, targetPropType } from 'reactstrap/lib/utils';

import { TooltipContent } from './TooltipContent';
import { registerOpenTooltip, rememberPointerPosition, unregisterOpenTooltip } from './pointerWatchdog';

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
    this.checkPointerAt = this.checkPointerAt.bind(this);
    this._isMounted = false;
    // The state we last asked the owner for. `props.isOpen` only catches up once React has
    // committed that request, and on a loaded page the pointer can leave the target well
    // before that happens — guarding on the prop alone drops the hide and the tooltip stays
    // on screen forever (COREDEV-356).
    this._requestedOpen = props.isOpen;
    // Whether a request is still waiting to be committed. An owner is free to ignore it, and
    // without this the intent above would stay latched at a value the owner never took.
    this._hasPendingRequest = false;
    // Whether the open one came from the pointer — only then is the pointer allowed to close it.
    this._openedByPointer = false;
    // The node the popper is currently anchored to, as of the last render.
    this._renderedTarget = null;
  }

  componentDidMount() {
    this._isMounted = true;
    this.recordRenderedTarget();
    this.updateTarget();
    this.syncOpenRegistry();
  }

  componentDidUpdate(prevProps) {
    this.syncRequestedOpen(prevProps);
    // Post-commit rather than in `render`: a render React throws away must not overwrite the record
    // of what is actually on screen, or `updateTarget` would skip a `forceUpdate` the popper needed.
    this.recordRenderedTarget();
    // Before `updateTarget`, which re-queries and would drop the node that has just been taken
    // away — leaving nothing to notice the loss by.
    this.checkTargetPresence();
    // Post-commit: `render` sees the DOM of the previous commit, so a target rendered by this very
    // update would be missed there, and a closed tooltip does not render at all — it used to lose
    // its listeners for good once its target node was replaced.
    this.updateTarget();
    this.syncOpenRegistry();
  }

  componentWillUnmount() {
    this._isMounted = false;
    unregisterOpenTooltip(this);
    unwatchForTarget(this);
    this.removeTargetEvents();
    this._targets = null;
    this.clearShowTimeout();
    this.clearHideTimeout();
  }

  /**
   * Brings the intent back in line with what the owner actually did.
   *
   * A controlled owner may drop the request on the floor — then the commit arrives with `isOpen`
   * unchanged, and holding on to the intent would latch the tooltip out of reach of both `show`
   * and `hide` for the rest of the page's life.
   */
  syncRequestedOpen(prevProps) {
    if (prevProps.isOpen !== this.props.isOpen) {
      this._requestedOpen = this.props.isOpen;
      this._hasPendingRequest = false;
      return;
    }

    if (this._hasPendingRequest) {
      this._requestedOpen = this.props.isOpen;
      this._hasPendingRequest = false;
    }
  }

  /** Is the tooltip on screen, or on its way there? The two flags disagree until a request commits. */
  isOpenNow() {
    return !!(this._requestedOpen || this.props.isOpen);
  }

  syncOpenRegistry() {
    if (this._isMounted && this._openedByPointer && this.isOpenNow()) {
      registerOpenTooltip(this);
    } else {
      unregisterOpenTooltip(this);
    }
  }

  /**
   * The target may leave the document while the tooltip is open — a dragged tab is replaced by a
   * clone, a tab is closed, a toolbar button is swapped for a placeholder. Nothing will ever send a
   * `mouseout` from a node that is no longer there.
   */
  checkTargetPresence() {
    if (!this.isOpenNow()) {
      return;
    }

    const anchor = this.currentTargetElement;

    if (anchor && !document.contains(anchor)) {
      this.hide();
      return;
    }

    if (this._targets && this._targets.length && !this._targets.some(target => document.contains(target))) {
      this.hide();
    }
  }

  /**
   * Asked by the watchdog: is `element` — what the pointer is actually on — still something that
   * keeps this tooltip open?
   *
   * The close is scheduled through the ordinary hide delay rather than fired outright: the pointer
   * may be mid-flight across the offset gap between the target and an interactive (`!autohide`)
   * tooltip's body, and landing there lets `onMouseOverTooltipContent` cancel the close — exactly
   * the grace the `mouseout` path has always given.
   */
  checkPointerAt(element) {
    if (!this._isMounted || !this.isOpenNow()) {
      return;
    }

    if (this.isPointerKeptBy(element)) {
      return;
    }

    if (!this._hideTimeout) {
      this.hideWithDelay();
    }
  }

  isPointerKeptBy(element) {
    if (!element) {
      return false;
    }

    if (isInDOMSubtrees(element, this._targets)) {
      return true;
    }

    // `autohide: false` is the promise that the pointer may travel onto the tooltip itself — that
    // is the whole point of the interactive ones, so the watchdog must not undercut it. The arrow
    // lives next to the content, hence the popper node rather than the content node.
    if (this.props.autohide) {
      return false;
    }

    const popperNode = this._popover && this._popover.parentElement;

    return !!(isInDOMSubtree(element, this._popover) || isInDOMSubtree(element, popperNode));
  }

  onMouseOverTooltipContent() {
    if (this.props.trigger.indexOf('hover') > -1 && !this.props.autohide) {
      this.clearHideTimeout();
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
      this._openedByPointer = !!e && e.type === 'mouseover';

      if (this._openedByPointer) {
        // The pointer may not move again after this, so its position is taken from the very event
        // that opens the tooltip; the watchdog starts from there.
        rememberPointerPosition(e);
      }

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
    // Unconditionally: a timer that fires after the tooltip closed by another path would otherwise
    // leave its dead id behind, and `checkPointerAt` treats a pending id as "close already on its
    // way" — it would never schedule one again.
    this.clearHideTimeout();

    // Either flag saying "open" is enough: if the owner never committed the request the prop is
    // still behind, and if the owner ignored a close request the intent is the one that is wrong.
    // Refusing to close on a disagreement is what leaves a tooltip on screen for good.
    if (this.isOpenNow()) {
      this.currentTargetElement = null;
      this._openedByPointer = false;
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
    // The intent, not the committed prop: two clicks inside one commit window both read a prop that
    // still says "closed" and both open the tooltip, so the second click does nothing visible and
    // the tooltip can no longer be clicked away.
    const isOpen = this._requestedOpen;

    if (triggers.indexOf('legacy') > -1 && (isOpen || isInDOMSubtrees(e.target, this._targets))) {
      this.clearHideTimeout();

      if (isOpen && !isInDOMSubtree(e.target, this._popover)) {
        this.hideWithDelay(e);
      } else if (!isOpen) {
        this.showWithDelay(e);
      }
    } else if (triggers.indexOf('click') > -1 && isInDOMSubtrees(e.target, this._targets)) {
      this.clearHideTimeout();

      if (!isOpen) {
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
      this.addTargetEvents();
    }

    // The anchor used to be kept for as long as it was set, so a tooltip that had once been opened
    // on a node stayed bound to it after the page replaced that node — and pointed at nothing, or
    // at whatever else had taken the same place.
    if (this.currentTargetElement && !isInDOMSubtrees(this.currentTargetElement, this._targets)) {
      this.currentTargetElement = null;
    }

    this.currentTargetElement = this.currentTargetElement || this._targets[0] || null;

    // Length alone is not presence: `target` may be handed in as an element, and an element that
    // has been taken out of the document will never announce itself to the observer either.
    if (this._targets.some(target => document.contains(target))) {
      unwatchForTarget(this);
    } else {
      watchForTarget(this);
    }

    // Re-binding alone is not enough while the tooltip is up: the popper is anchored to the node
    // that was there at render time. The conditions mirror `render`'s own bail-out, or the two
    // would keep waking each other up.
    if (this._isMounted && this.props.isOpen && !this.props.isHiddenTarget && this._renderedTarget !== this.getAnchor()) {
      this.forceUpdate();
    }
  }

  /** The node the popper hangs off: the one the pointer arrived on, or the first target. */
  getAnchor() {
    return this.currentTargetElement || (this._targets && this._targets[0]) || null;
  }

  /** What this commit put on screen — the same value `render` just anchored the popper to. */
  recordRenderedTarget() {
    this._renderedTarget = !this.props.isOpen || this.props.isHiddenTarget ? null : this.getAnchor();
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
      this._hasPendingRequest = true;
    }

    this.syncOpenRegistry();

    return this.props.toggle(e, nextOpen);
  }

  render() {
    if (!this.props.isOpen || this.props.isHiddenTarget) {
      return null;
    }

    // Mirrors `recordRenderedTarget`, which notes this value post-commit; render itself must not
    // write instance state — a discarded render would leave a record of something never shown.
    const anchor = this.getAnchor();

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
        target={anchor}
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
