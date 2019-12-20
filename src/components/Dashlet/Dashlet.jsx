import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';

import { t } from '../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_DEFAULT_HEIGHT_DASHLET } from '../../constants';
import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { Btn, IcoBtn } from '../common/btns';
import { Badge } from '../common/form';
import { Icon, ResizableBox } from '../common';
import BtnActions from './BtnActions';

import './Dashlet.scss';

const Header = ({
  dashletId,
  dragHandleProps,
  title,
  needGoTo,
  onGoTo,
  onToggleCollapse,
  actionDrag,
  measurer,
  titleClassName,
  isMobile,
  isCollapsed,
  badgeText,
  configActions,
  orderActions
}) => {
  const btnGoTo = isMobile ? null : (
    <IcoBtn title={t('dashlet.goto')} invert icon={'icon-big-arrow'} className="dashlet__btn ecos-btn_narrow" onClick={onGoTo}>
      {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
    </IcoBtn>
  );

  let toggleIcon = null;
  let dragBtn = null;

  if (actionDrag) {
    dragBtn = (
      <span className="dashlet__btn_move-wrapper" {...dragHandleProps}>
        <IcoBtn
          key="action-drag"
          icon={'icon-drag'}
          className="ecos-btn_i dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1"
          title={t('dashlet.move.title')}
        />
      </span>
    );
  }

  if (isMobile) {
    toggleIcon = (
      <Icon
        className={classNames('dashlet__header-collapser', {
          'icon-down': isCollapsed,
          'icon-up': !isCollapsed
        })}
      />
    );
  }

  return (
    <div className="dashlet__header" onClick={onToggleCollapse}>
      <span className={classNames('dashlet__caption', titleClassName)}>
        {toggleIcon}
        {title}
      </span>

      <Badge text={badgeText} size={isMobile ? 'small' : 'large'} />

      {needGoTo && btnGoTo}

      <div className="dashlet__header-actions">
        {!isMobile && <BtnActions configActions={configActions} orderActions={orderActions} dashletId={dashletId} />}
        {dragBtn}
      </div>
    </div>
  );
};

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
    //-------------------------------------
    actionReload: PropTypes.bool,
    actionEdit: PropTypes.bool,
    actionHelp: PropTypes.bool,
    onEdit: PropTypes.func,
    onReload: PropTypes.func
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
      orderActions
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
