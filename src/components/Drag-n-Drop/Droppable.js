import React from 'react';
import PropTypes from 'prop-types';
import { Droppable as DropWrapper } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import './style.scss';

export default class Droppable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string
  };

  static defaultProps = {
    className: '',
    children: null,
    style: {},
    placeholder: ''
  };

  className(isDraggingOver = false) {
    const { className } = this.props;
    const classes = ['ecos-dnd__droppable'];

    if (className) {
      classes.push(className);
    }

    if (isDraggingOver) {
      classes.push('ecos-dnd__droppable_over');
    }

    return classes.join(' ');
  }

  renderChildrens() {
    const { children, style, placeholder } = this.props;

    if (children) {
      return <Scrollbars style={style}>{children}</Scrollbars>;
    }

    return <div className="ecos-dnd__placeholder">{placeholder}</div>;
  }

  render() {
    const { id } = this.props;

    return (
      <DropWrapper droppable="droppable" droppableId={id}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} className={this.className(snapshot.isDraggingOver)}>
            {this.renderChildrens()}
            {provided.placeholder}
          </div>
        )}
      </DropWrapper>
    );
  }
}
