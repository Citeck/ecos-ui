import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';

import { IcoBtn } from '../common/btns';

import './drag-item.scss';
import { Tooltip, Icon } from '../common';
import { prepareTooltipId } from '../../helpers/util';

class DragItem extends React.Component {
  static propTypes = {
    draggableIndex: PropTypes.number,
    draggableId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    className: PropTypes.string,
    title: PropTypes.string,
    alertTooltip: PropTypes.string,
    selected: PropTypes.bool,
    canRemove: PropTypes.bool,
    removeItem: PropTypes.func,
    // In order to get the adjustment of the position of the draggable element
    getPositionAdjusment: PropTypes.func,
    isDragDisabled: PropTypes.bool,
    isCloning: PropTypes.bool,
    isWrapper: PropTypes.bool,
    item: PropTypes.object
  };

  static defaultProps = {
    className: '',
    title: '',
    alertTooltip: '',
    selected: false,
    canRemove: false,
    isDragDisabled: false,
    isCloning: false,
    draggableIndex: 0,
    item: null,
    removeItem: () => {},
    getPositionAdjusment: () => ({ top: 0, left: 0 }),
    children: null,
    isWrapper: false
  };

  _className = 'ecos-drag-item';

  getDragItemStyle = (isDragging, draggableStyle) => {
    const { className, selected, isDragDisabled } = this.props;

    return classNames(this._className, className, { [`${this._className}_selected`]: selected }, { test: isDragging }, draggableStyle, {
      [`${this._className}_disabled`]: isDragDisabled
    });
  };

  removeItem = () => {
    const { item, draggableId, draggableIndex } = this.props;

    this.props.removeItem({ item, draggable: { draggableId, draggableIndex } });
  };

  renderAlert = () => {
    const { alertTooltip, draggableId } = this.props;

    if (!alertTooltip) {
      return null;
    }

    const tooltipId = prepareTooltipId(`widget-tooltip-${draggableId}`);

    return (
      <Tooltip target={tooltipId} text={alertTooltip} placement="top" trigger="hover" uncontrolled autohide>
        <Icon id={tooltipId} className={classNames('icon-big_alert ecos-drag-item__actions-item ecos-drag-item__actions-item-alert')} />
      </Tooltip>
    );
  };

  renderActions() {
    const { selected, canRemove } = this.props;
    const _actions = `${this._className}__actions`;
    const _btn = `ecos-btn_width_auto ecos-btn_transparent`;

    return (
      <div className={_actions}>
        {this.renderAlert()}
        {canRemove && (
          <IcoBtn
            icon={'icon-close'}
            className={classNames(_btn, `${_actions}__btn-remove`, { 'ecos-btn_grey5': selected })}
            onClick={this.removeItem}
          />
        )}
        <IcoBtn
          icon={'icon-custom-drag-big'}
          className={classNames(
            _btn,
            `${_actions}__btn-move`,
            'ecos-btn_focus_no',
            { 'ecos-btn_grey': selected },
            { 'ecos-btn_grey4': !selected }
          )}
        />
      </div>
    );
  }

  renderItem() {
    const { title } = this.props;

    return (
      <>
        <span className={`${this._className}__title`}>{title}</span>
        {this.renderActions()}
      </>
    );
  }

  renderDoppelganger(isDragging) {
    const { isCloning } = this.props;

    if (!isDragging || !isCloning) {
      return null;
    }

    return <div className={`${this.props.className} ${this._className} ${this._className}_clone`}>{this.renderItem()}</div>;
  }

  renderBody = (provided, snapshot) => {
    const positionAdjusment = this.props.getPositionAdjusment();

    if (positionAdjusment) {
      const {
        draggableProps: { style }
      } = provided;
      const { top, left } = positionAdjusment;

      if (top && style.top) {
        provided.draggableProps.style.top = style.top + top;
      }

      if (left && style.left) {
        provided.draggableProps.style.left = style.left + left;
      }
    }

    return (
      <>
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={this.getDragItemStyle(snapshot.isDragging, provided.draggableProps.style)}
          style={provided.draggableProps.style}
        >
          {this.renderItem()}
        </div>
        {this.renderDoppelganger(snapshot.isDragging)}
      </>
    );
  };

  render() {
    const { draggableId, draggableIndex, isDragDisabled } = this.props;

    return (
      <Draggable draggableId={draggableId} index={draggableIndex} isDragDisabled={isDragDisabled}>
        {this.renderBody}
      </Draggable>
    );
  }
}

class Wrapper extends DragItem {
  renderBody = (provided, snapshot) => {
    const positionAdjusment = this.props.getPositionAdjusment();

    if (positionAdjusment) {
      const {
        draggableProps: { style }
      } = provided;
      const { top, left } = positionAdjusment;

      if (top && style.top) {
        provided.draggableProps.style.top = style.top + top;
      }

      if (left && style.left) {
        provided.draggableProps.style.left = style.left + left;
      }
    }

    return (
      <>
        {this.renderDoppelganger(snapshot.isDragging)}

        <div ref={provided.innerRef} {...provided.draggableProps} style={provided.draggableProps.style}>
          {React.cloneElement(this.props.children, { dragHandleProps: { ...provided.dragHandleProps } })}
          <div {...provided.dragHandleProps} />
        </div>
      </>
    );
  };
}

export default function(props) {
  if (props.isWrapper) {
    return <Wrapper {...props} />;
  }

  return <DragItem {...props} />;
}
