import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import './drag-item.scss';
import { IcoBtn } from '../common/btns';

export class DragItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    selected: PropTypes.bool,
    canRemove: PropTypes.bool,
    removeItem: PropTypes.func
  };

  static defaultProps = {
    className: '',
    title: '',
    selected: false,
    canRemove: false,
    removeItem: () => {}
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

  render() {
    const { id, index } = this.props;

    return (
      <Draggable key={id} draggableId={id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={this.getDragItemStyle(snapshot.isDragging, provided.draggableProps.style)}
          >
            {this.renderItem()}
          </div>
        )}
      </Draggable>
    );
  }
}
