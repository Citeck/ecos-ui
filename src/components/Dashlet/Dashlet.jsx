import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';

import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_DEFAULT_HEIGHT_DASHLET } from '../../constants';
import { t, getDOMElementMeasurer } from '../../helpers/util';
import { Loader, Panel, ResizableBox } from '../common';
import { Btn } from '../common/btns';
import { ErrorBoundary } from '../ErrorBoundary';
import Header from './Header';

import './Dashlet.scss';

const Labels = {
  ERROR_BOUNDARY_MSG: 'dashlet.error-boundary.msg'
};

class Dashlet extends Component {
  static propTypes = {
    title: PropTypes.string,
    className: PropTypes.string,
    bodyClassName: PropTypes.string,
    titleClassName: PropTypes.string,
    badgeText: PropTypes.string,
    goToButtonName: PropTypes.object,
    noHeader: PropTypes.bool,
    noBody: PropTypes.bool,
    needGoTo: PropTypes.bool,
    actionDrag: PropTypes.bool,
    resizable: PropTypes.bool,
    canDragging: PropTypes.bool,
    isMobile: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    collapsible: PropTypes.bool,
    dragHandleProps: PropTypes.object,
    contentMaxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    onGoTo: PropTypes.func,
    onResize: PropTypes.func,
    onToggleCollapse: PropTypes.func,
    dragButton: PropTypes.func,
    onChangeHeight: PropTypes.func,
    getFitHeights: PropTypes.func,
    actionConfig: PropTypes.object,
    actionRules: PropTypes.object,
    noActions: PropTypes.bool,
    isLoading: PropTypes.bool,
    customActions: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),

    setRef: PropTypes.func
  };

  static defaultProps = {
    title: '',
    className: '',
    bodyClassName: '',
    titleClassName: '',
    badgeText: '',
    noHeader: false,
    noBody: false,
    needGoTo: true,
    actionDrag: true,
    resizable: false,
    canDragging: false,
    isMobile: false,
    isCollapsed: false,
    collapsible: true,
    dragButton: null,
    dragHandleProps: {},
    contentMaxHeight: null,
    onGoTo: () => {},
    onResize: () => {},
    onToggleCollapse: () => {},
    onChangeHeight: () => null,
    getFitHeights: () => null
  };

  #dashletRef = null;

  resizableRef = React.createRef();

  constructor(props) {
    super(props);

    this.dashletId = uniqueId('dashlet-id');

    this.state = {
      busyHeightsCalculated: false
    };
  }

  componentDidMount() {
    this.props.getFitHeights(this.fitHeightChildren);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!this.state.busyHeightsCalculated) {
      this.checkBusyHeights();
    }

    if (!prevState.busyHeightsCalculated && this.state.busyHeightsCalculated) {
      this.props.getFitHeights(this.fitHeightChildren);
    }
  }

  checkBusyHeights = () => {
    const elDashlet = this.#dashletRef || {};
    const headerH = get(elDashlet.querySelector('.dashlet__header-wrapper'), ['offsetHeight'], 0);

    if (headerH) {
      this.setState({ busyHeightsCalculated: true });
    }
  };

  get fitHeightChildren() {
    const { headerHeight } = this.busyDashletHeight;
    const busyArea = headerHeight;

    const max = MAX_DEFAULT_HEIGHT_DASHLET - busyArea;
    const min = MIN_DEFAULT_HEIGHT_DASHLET - busyArea;

    return { min, max, headerHeight };
  }

  get busyDashletHeight() {
    const elDashlet = this.#dashletRef || {};
    const content = elDashlet.querySelector('.dashlet__body-content');

    if (!content) {
      return {};
    }

    const contentStyle = window.getComputedStyle(content);
    const paddingTop = parseInt(contentStyle.paddingTop, 10) || 0;
    const paddingBottom = parseInt(contentStyle.paddingBottom, 10) || 0;
    const headerHeight = get(elDashlet.querySelector('.dashlet__header-wrapper'), ['offsetHeight'], 0);

    return { headerHeight: headerHeight + paddingBottom + paddingTop };
  }

  setDashletRef = ref => {
    if (ref) {
      this.#dashletRef = ref;

      if (typeof this.props.setRef === 'function') {
        this.props.setRef(ref);
      }
    }
  };

  onGoTo = () => {
    const { onGoTo } = this.props;

    if (typeof onGoTo === 'function') {
      onGoTo.call(this);
    }
  };

  onChangeHeight = height => {
    const { onChangeHeight, contentMaxHeight, getFitHeights } = this.props;

    if (typeof onChangeHeight === 'function') {
      onChangeHeight(contentMaxHeight && height > contentMaxHeight ? contentMaxHeight : height);

      getFitHeights && getFitHeights(this.fitHeightChildren);
    }
  };

  onToggle = () => {
    const { onToggleCollapse, isCollapsed } = this.props;

    onToggleCollapse(!isCollapsed);
  };

  renderContent() {
    const { isMobile, children } = this.props;

    if (isMobile) {
      return children;
    }

    return (
      <ResizableBox ref={this.resizableRef} classNameResizer="dashlet__resizer" getHeight={this.onChangeHeight}>
        {children}
      </ResizableBox>
    );
  }

  renderHideButton() {
    const { isMobile, collapsible } = this.props;

    if (!collapsible) {
      return null;
    }

    if (!isMobile) {
      return null;
    }

    return (
      <div className="dashlet__body-actions">
        <Btn className="ecos-btn_full-width ecos-btn_sq_sm" onClick={this.onToggle}>
          Свернуть
        </Btn>
      </div>
    );
  }

  renderLoader = () => {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur rounded />;
  };

  render() {
    const {
      title,
      className,
      bodyClassName,
      titleClassName,
      badgeText,
      needGoTo,
      goToButtonName,
      actionDrag,
      onResize,
      dragHandleProps,
      canDragging,
      isMobile,
      noHeader,
      noBody,
      actionConfig,
      actionRules,
      noActions,
      children,
      isCollapsed,
      customActions
    } = this.props;

    return (
      <div ref={this.setDashletRef} className="dashlet">
        <Panel
          {...this.props}
          className={classNames('dashlet', className, { dashlet_mobile: isMobile })}
          headClassName={classNames('dashlet__header-wrapper', {
            'dashlet__header-wrapper_collapsed': noBody || isCollapsed
          })}
          bodyClassName={classNames('dashlet__body', bodyClassName, {
            dashlet__body_collapsed: noBody || isCollapsed
          })}
          noHeader={noHeader}
          header={
            !noHeader && (
              <Header
                measurer={getDOMElementMeasurer(this.#dashletRef)}
                title={title}
                needGoTo={needGoTo}
                onGoTo={this.onGoTo}
                goToButtonName={goToButtonName}
                onToggleCollapse={this.onToggle}
                actionDrag={actionDrag && canDragging}
                dragHandleProps={dragHandleProps}
                titleClassName={titleClassName}
                isCollapsed={isCollapsed}
                badgeText={badgeText}
                dashletId={this.dashletId}
                actionConfig={actionConfig}
                actionRules={actionRules}
                noActions={noActions}
                customActions={customActions}
              />
            )
          }
        >
          <ErrorBoundary message={t(Labels.ERROR_BOUNDARY_MSG)} className="dashlet__error-boundary">
            <div
              className={classNames('dashlet__body-content', {
                'dashlet__body-content_hidden': noBody || (isMobile && isCollapsed)
              })}
            >
              {children}
              {this.renderHideButton()}
            </div>
            <div className="dashlet__body-indent dashlet__body-indent_bottom" />
          </ErrorBoundary>
        </Panel>
        <ReactResizeDetector handleWidth handleHeight onResize={debounce(onResize, 400)} />

        {this.renderLoader()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isMobile: get(state, 'view.isMobile')
});

export default connect(
  mapStateToProps,
  null
)(Dashlet);
