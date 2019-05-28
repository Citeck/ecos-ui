import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import { IcoBtn } from '../common/btns';
import './drag-item.scss';

export class DragItem extends React.Component {
  static propTypes = {
    draggableId: PropTypes.string.isRequired,
    className: PropTypes.string,
    title: PropTypes.string,
    selected: PropTypes.bool,
    canRemove: PropTypes.bool,
    removeItem: PropTypes.func,
    // In order to get the adjustment of the position of the draggable element
    getPositionAdjusment: PropTypes.func
  };

  static defaultProps = {
    className: '',
    title: '',
    selected: false,
    canRemove: false,
    removeItem: () => {},
    getPositionAdjusment: () => ({ top: 0, left: 0 })
  };

  _className = 'ecos-drag-item';

  getDragItemStyle = (isDragging, draggableStyle) => {
    const { className, selected } = this.props;

    return classNames(this._className, className, { [`${this._className}_selected`]: selected }, { test: isDragging }, draggableStyle);
  };

  removeItem = () => {
    this.props.removeItem(this.props);
    console.log({ ...this.props });
  };

  renderActions() {
    const { selected, canRemove } = this.props;
    const _actions = `${this._className}__actions`;
    const _btn = `ecos-btn_width_auto ecos-btn_transparent`;

    return (
      <div className={_actions}>
        {canRemove && (
          <IcoBtn
            icon={'icon-close'}
            className={classNames(_btn, `${_actions}__btn-remove`, { 'ecos-btn_grey5': selected })}
            onClick={this.removeItem}
          />
        )}
        <IcoBtn
          icon={'icon-drag'}
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
      <React.Fragment>
        <span className={`${this._className}__title`}>{title}</span>
        {this.renderActions()}
      </React.Fragment>
    );
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
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={this.getDragItemStyle(snapshot.isDragging, provided.draggableProps.style)}
      >
        {this.renderItem()}
      </div>
    );
  };

  render() {
    const { draggableId, index } = this.props;

    return (
      <Draggable draggableId={draggableId} index={index}>
        {this.renderBody}
      </Draggable>
    );
  }
}
