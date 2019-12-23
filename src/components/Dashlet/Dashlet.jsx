import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';

import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_DEFAULT_HEIGHT_DASHLET } from '../../constants';
import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { Btn } from '../common/btns';
import { ResizableBox } from '../common';
import Header from './Header';

import './Dashlet.scss';

class Dashlet extends Component {
  static propTypes = {
    title: PropTypes.string,
    className: PropTypes.string,
    bodyClassName: PropTypes.string,
    titleClassName: PropTypes.string,
    badgeText: PropTypes.string,
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
    configActions: PropTypes.object,
    orderActions: PropTypes.object,
    noActions: PropTypes.bool
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

  refDashlet = React.createRef();

  constructor(props) {
    super(props);

    this.dashletId = uniqueId('dashlet-id');

    this.state = {
      isCollapsed: props.isCollapsed || false
    };
  }

  componentDidMount() {
    this.props.getFitHeights(this.fitHeightChildren);
  }

  get fitHeightChildren() {
    const busyArea = this.busyDashletHeight;

    const max = MAX_DEFAULT_HEIGHT_DASHLET - busyArea;
    const min = MIN_DEFAULT_HEIGHT_DASHLET - busyArea;

    return { min, max };
  }

  get busyDashletHeight() {
    const elDashlet = this.refDashlet.current || {};
    const headerH = get(elDashlet.querySelector('.dashlet__header-wrapper'), ['offsetHeight'], 0);
    const resizerH = get(elDashlet.querySelector('.dashlet__resizer'), ['offsetHeight'], 0);

    return headerH + resizerH;
  }

  onGoTo = () => {
    const { onGoTo } = this.props;

    if (typeof onGoTo === 'function') {
      onGoTo.call(this);
    }
  };

  onChangeHeight = height => {
    const { onChangeHeight, contentMaxHeight } = this.props;

    if (typeof onChangeHeight === 'function') {
      onChangeHeight(height > contentMaxHeight && contentMaxHeight !== null ? contentMaxHeight : height);

      this.props.getFitHeights(this.fitHeightChildren);
    }
  };

  onToggle = () => {
    const { onToggleCollapse, isMobile } = this.props;
    const { isCollapsed } = this.state;

    if (!isMobile) {
      return;
    }

    this.setState({ isCollapsed: !isCollapsed });
    onToggleCollapse(!isCollapsed);
  };

  renderContent() {
    const { isMobile, resizable, children } = this.props;

    if (isMobile) {
      return children;
    }

    return (
      <ResizableBox resizable={resizable} classNameResizer={'dashlet__resizer'} getHeight={this.onChangeHeight}>
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

  render() {
    const {
      title,
      className,
      bodyClassName,
      titleClassName,
      badgeText,
      needGoTo,
      actionDrag,
      onResize,
      dragHandleProps,
      canDragging,
      isMobile,
      noHeader,
      noBody,
      configActions,
      orderActions,
      noActions
    } = this.props;
    const { isCollapsed } = this.state;

    return (
      <div ref={this.refDashlet}>
        <Panel
          {...this.props}
          className={classNames('dashlet', className, { dashlet_mobile: isMobile })}
          headClassName={classNames('dashlet__header-wrapper', {
            'dashlet__header-wrapper_collapsed': noBody || (isMobile && isCollapsed)
          })}
          bodyClassName={classNames('dashlet__body', bodyClassName, {
            dashlet__body_collapsed: noBody || (isMobile && isCollapsed)
          })}
          noHeader={noHeader}
          header={
            !noHeader && (
              <Measurer className="dashlet__header-measurer">
                <Header
                  title={title}
                  needGoTo={needGoTo}
                  onGoTo={this.onGoTo}
                  onToggleCollapse={this.onToggle}
                  actionDrag={actionDrag && canDragging}
                  dragHandleProps={dragHandleProps}
                  titleClassName={titleClassName}
                  isMobile={isMobile}
                  isCollapsed={isCollapsed}
                  badgeText={badgeText}
                  dashletId={this.dashletId}
                  configActions={configActions}
                  orderActions={orderActions}
                  noActions={noActions}
                />
              </Measurer>
            )
          }
        >
          <div className={classNames('dashlet__body-content', { 'dashlet__body-content_hidden': noBody || (isMobile && isCollapsed) })}>
            {this.renderContent()}
            {this.renderHideButton()}
          </div>
        </Panel>

        <ReactResizeDetector handleWidth handleHeight onResize={debounce(onResize, 400)} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isMobile: get(state, ['view', 'isMobile'])
});
const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashlet);
