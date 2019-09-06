import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';

import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { Btn, IcoBtn } from '../common/btns';
import { Icon, ResizableBox } from '../common';
import { t } from '../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_DEFAULT_HEIGHT_DASHLET } from '../../constants';

import './Dashlet.scss';

const Header = ({
  dragHandleProps,
  title,
  needGoTo,
  onGoTo,
  onReload,
  onEdit,
  onToggleCollapse,
  actionReload,
  actionEdit,
  actionHelp,
  actionDrag,
  measurer,
  actionEditTitle,
  customButtons,
  titleClassName,
  isMobile
}) => {
  const btnGoTo = isMobile ? null : (
    <IcoBtn title={t('dashlet.goto')} invert icon={'icon-big-arrow'} className="dashlet__btn ecos-btn_narrow" onClick={onGoTo}>
      {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
    </IcoBtn>
  );
  const actions = [...customButtons];
  let toggleIcon = null;
  let dragBtn = null;

  if (actionReload) {
    actions.push(
      <IcoBtn
        key="action-reload"
        icon={'icon-reload'}
        className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        onClick={onReload}
        title={t('dashlet.update.title')}
      />
    );
  }

  if (actionEdit) {
    actions.push(
      <IcoBtn
        key="action-edit"
        icon={'icon-edit'}
        className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        onClick={onEdit}
        title={actionEditTitle || t('dashlet.edit.title')}
      />
    );
  }

  if (actionHelp) {
    actions.push(
      <IcoBtn
        key="action-help"
        icon={'icon-question'}
        className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        title={t('dashlet.help.title')}
      />
    );
  }

  if (actionDrag) {
    dragBtn = (
      <span className="dashlet__btn_move-wrapper" {...dragHandleProps}>
        <IcoBtn
          key="action-drag"
          icon={'icon-drag'}
          className="ecos-btn_i dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1"
          title={t('dashlet.move.title')}
        />
      </span>
    );
  }

  if (isMobile) {
    toggleIcon = <Icon className="dashlet__header-collapser icon-down" />;
  }

  return (
    <div className="dashlet__header" onClick={onToggleCollapse}>
      <span className={classNames('dashlet__caption', titleClassName)}>
        {toggleIcon}
        {title}
      </span>

      {needGoTo && btnGoTo}

      <div className="dashlet__header-actions">
        {!isMobile && actions}
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
    actionEditTitle: PropTypes.string,
    needGoTo: PropTypes.bool,
    actionReload: PropTypes.bool,
    actionEdit: PropTypes.bool,
    actionHelp: PropTypes.bool,
    actionDrag: PropTypes.bool,
    resizable: PropTypes.bool,
    canDragging: PropTypes.bool,
    isMobile: PropTypes.bool,
    dragHandleProps: PropTypes.object,
    customButtons: PropTypes.array,
    onEdit: PropTypes.func,
    onGoTo: PropTypes.func,
    onReload: PropTypes.func,
    onResize: PropTypes.func,
    onToggleCollapse: PropTypes.func,
    dragButton: PropTypes.func,
    onChangeHeight: PropTypes.func,
    getFitHeights: PropTypes.func
  };

  static defaultProps = {
    title: '',
    className: '',
    bodyClassName: '',
    titleClassName: '',
    needGoTo: true,
    actionReload: true,
    actionEdit: true,
    actionHelp: true,
    actionDrag: true,
    resizable: false,
    canDragging: false,
    isMobile: false,
    dragButton: null,
    dragHandleProps: {},
    customButtons: [],
    onEdit: () => {},
    onGoTo: () => {},
    onReload: () => {},
    onResize: () => {},
    onToggleCollapse: () => {},
    onChangeHeight: () => null,
    getFitHeights: () => null
  };

  refDashlet = React.createRef();

  constructor(props) {
    super(props);

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

  onEdit = () => {
    const { onEdit } = this.props;

    if (typeof onEdit === 'function') {
      onEdit.call(this);
    }
  };

  onGoTo = () => {
    const { onGoTo } = this.props;

    if (typeof onGoTo === 'function') {
      onGoTo.call(this);
    }
  };

  onReload = () => {
    const { onReload } = this.props;

    if (typeof onReload === 'function') {
      onReload.call(this);
    }
  };

  onChangeHeight = height => {
    const { onChangeHeight } = this.props;

    if (typeof onChangeHeight === 'function') {
      onChangeHeight(height);

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
    const { isMobile } = this.props;

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
      actionEditTitle,
      needGoTo,
      actionReload,
      actionEdit,
      actionHelp,
      actionDrag,
      onResize,
      dragHandleProps,
      canDragging,
      customButtons,
      isMobile
    } = this.props;
    const { isCollapsed } = this.state;
    const cssClasses = classNames('dashlet', className);

    return (
      <div ref={this.refDashlet}>
        <Panel
          {...this.props}
          className={cssClasses}
          headClassName={classNames('dashlet__header-wrapper', {
            'dashlet__header-wrapper_rounded': isMobile && isCollapsed
          })}
          bodyClassName={classNames('dashlet__body', bodyClassName, {
            dashlet__body_collapsed: isMobile && isCollapsed
          })}
          header={
            <Measurer className="dashlet__header-measurer">
              <Header
                title={title}
                needGoTo={needGoTo}
                onGoTo={this.onGoTo}
                actionReload={actionReload}
                onReload={this.onReload}
                onToggleCollapse={this.onToggle}
                actionEdit={actionEdit}
                onEdit={this.onEdit}
                actionHelp={actionHelp}
                actionDrag={actionDrag && canDragging}
                dragHandleProps={dragHandleProps}
                actionEditTitle={actionEditTitle}
                customButtons={customButtons}
                titleClassName={titleClassName}
                isMobile={isMobile}
              />
            </Measurer>
          }
        >
          <div
            className={classNames('dashlet__body-content', {
              'dashlet__body-content_hidden': isMobile && isCollapsed
            })}
          >
            {this.renderContent()}
            {this.renderHideButton()}
          </div>
        </Panel>

        <ReactResizeDetector handleWidth handleHeight onResize={onResize} />
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
