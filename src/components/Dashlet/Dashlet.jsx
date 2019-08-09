import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';

import Panel from '../common/panels/Panel/Panel';
import Measurer from '../Measurer/Measurer';
import { IcoBtn } from '../common/btns';
import { ResizableBox } from '../common';
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
  actionReload,
  actionEdit,
  actionHelp,
  actionDrag,
  measurer,
  actionEditTitle,
  customButtons
}) => {
  const btnGoTo = (
    <IcoBtn title={t('dashlet.goto')} invert icon={'icon-big-arrow'} className={'dashlet__btn ecos-btn_narrow'} onClick={onGoTo}>
      {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
    </IcoBtn>
  );

  const actions = [...customButtons];

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

  return (
    <div className={'dashlet__header'}>
      <span className={'dashlet__caption'}>{title}</span>

      {needGoTo && btnGoTo}

      <div className={'dashlet__actions dashlet__actions_header'}>{actions}</div>
    </div>
  );
};

export default class Dashlet extends Component {
  static propTypes = {
    title: PropTypes.string,
    className: PropTypes.string,
    bodyClassName: PropTypes.string,
    actionEditTitle: PropTypes.string,
    needGoTo: PropTypes.bool,
    actionReload: PropTypes.bool,
    actionEdit: PropTypes.bool,
    actionHelp: PropTypes.bool,
    actionDrag: PropTypes.bool,
    resizable: PropTypes.bool,
    canDragging: PropTypes.bool,
    dragHandleProps: PropTypes.object,
    customButtons: PropTypes.array,
    onEdit: PropTypes.func,
    onGoTo: PropTypes.func,
    onReload: PropTypes.func,
    onResize: PropTypes.func,
    dragButton: PropTypes.func,
    onChangeHeight: PropTypes.func,
    getFitHeights: PropTypes.func
  };

  static defaultProps = {
    title: '',
    className: '',
    bodyClassName: '',
    needGoTo: true,
    actionReload: true,
    actionEdit: true,
    actionHelp: true,
    actionDrag: true,
    resizable: false,
    canDragging: false,
    dragButton: null,
    dragHandleProps: {},
    customButtons: [],
    onEdit: () => {},
    onGoTo: () => {},
    onReload: () => {},
    onResize: () => {},
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
    const headerH = elDashlet.querySelector('.dashlet__wrap-header').offsetHeight || 0;
    const resizerH = elDashlet.querySelector('.dashlet__resizer').offsetHeight || 0;

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
    }
  };

  render() {
    const {
      title,
      className,
      bodyClassName,
      actionEditTitle,
      needGoTo,
      actionReload,
      resizable,
      children,
      actionEdit,
      actionHelp,
      actionDrag,
      onResize,
      dragHandleProps,
      canDragging,
      customButtons
    } = this.props;
    const cssClasses = classNames('dashlet', className);

    return (
      <div ref={this.refDashlet}>
        <Panel
          {...this.props}
          className={cssClasses}
          headClassName={'dashlet__wrap-header ecos-panel__large'}
          bodyClassName={classNames('dashlet__body', bodyClassName)}
          header={
            <Measurer>
              <Header
                title={title}
                needGoTo={needGoTo}
                onGoTo={this.onGoTo}
                actionReload={actionReload}
                onReload={this.onReload}
                actionEdit={actionEdit}
                onEdit={this.onEdit}
                actionHelp={actionHelp}
                actionDrag={actionDrag && canDragging}
                dragHandleProps={dragHandleProps}
                actionEditTitle={actionEditTitle}
                customButtons={customButtons}
              />
            </Measurer>
          }
        >
          <ResizableBox resizable={resizable} classNameResizer={'dashlet__resizer'} getHeight={this.onChangeHeight}>
            {children}
          </ResizableBox>
        </Panel>

        <ReactResizeDetector handleWidth handleHeight onResize={onResize} />
      </div>
    );
  }
}
