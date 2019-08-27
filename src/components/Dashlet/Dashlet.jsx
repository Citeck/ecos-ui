import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';

import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { IcoBtn, Btn } from '../common/btns';
import { ResizableBox, Icon } from '../common';
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
  onToggle,
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
  const btnGoTo = (
    <IcoBtn title={t('dashlet.goto')} invert icon={'icon-big-arrow'} className={'dashlet__btn ecos-btn_narrow'} onClick={onGoTo}>
      {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
    </IcoBtn>
  );
  const actions = [...customButtons];
  let toggleBtn = null;

  if (actionReload) {
    actions.push(
      <IcoBtn
        key="action-reload"
        icon={'icon-reload'}
        className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
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
        className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
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
        className={'ecos-btn_i dashlet__btn_hidden dashlet__btn_next ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
        title={t('dashlet.help.title')}
      />
    );
  }

  if (actionDrag) {
    actions.push(
      <span className="dashlet__btn_move-wrapper" {...dragHandleProps}>
        <IcoBtn
          key="action-drag"
          icon={'icon-drag'}
          className={'ecos-btn_i dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1'}
          title={t('dashlet.move.title')}
        />
      </span>
    );
  }

  if (isMobile) {
    toggleBtn = <Icon className="dashlet__header-toggle icon-down" />;
  }

  return (
    <div className={'dashlet__header'}>
      <span
        onClick={onToggle}
        // onTouchEnd={onToggle}
        className={classNames('dashlet__caption', titleClassName)}
      >
        {toggleBtn}
        {title}
      </span>

      {needGoTo && btnGoTo}

      <div className={'dashlet__actions dashlet__actions_header'}>{actions}</div>
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
    onToggle: PropTypes.func,
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
    onToggle: () => {},
    onChangeHeight: () => null,
    getFitHeights: () => null
  };

  refDashlet = React.createRef();

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
    const headerH = get(elDashlet.querySelector('.dashlet__wrap-header'), ['offsetHeight'], 0);
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
    const { isMobile, onToggle } = this.props;

    if (!isMobile) {
      return null;
    }

    return (
      <div className="dashlet__body-actions">
        <Btn className="ecos-btn_full-width ecos-btn_sq_sm" onClick={onToggle}>
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
      isMobile,
      onToggle,
      isCollapsed
    } = this.props;
    const cssClasses = classNames('dashlet', className);

    return (
      <div ref={this.refDashlet}>
        <Panel
          {...this.props}
          className={cssClasses}
          headClassName={classNames('dashlet__wrap-header ecos-panel__large', {
            'dashlet__wrap-header_rounded': isCollapsed
          })}
          bodyClassName={classNames('dashlet__body', bodyClassName)}
          header={
            <Measurer>
              <Header
                title={title}
                needGoTo={needGoTo}
                onGoTo={this.onGoTo}
                actionReload={actionReload}
                onReload={this.onReload}
                onToggle={onToggle}
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
              'dashlet__body-content_hidden': isCollapsed
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
