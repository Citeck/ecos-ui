import React from 'react';
import PropTypes from 'prop-types';
import { Droppable as DropWrapper } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import './style.scss';

export class Droppable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    direction: PropTypes.string
  };

  static defaultProps = {
    className: '',
    children: null,
    style: {},
    placeholder: '',
    direction: 'vertical'
  };

  className(isDraggingOver = false, draggingFromThisWith = false) {
    const { className } = this.props;
    const classes = ['ecos-dnd__droppable'];

    if (className) {
      classes.push(className);
    }

    if (isDraggingOver && !draggingFromThisWith) {
      classes.push('ecos-dnd__droppable_over');
    }

    return classes.join(' ');
  }

  renderChildren = () => {
    const { children, placeholder } = this.props;
    const renderTrackHorizontal = props => <div {...props} hidden />;

    if (children) {
      return <Scrollbars renderTrackHorizontal={renderTrackHorizontal}>{children}</Scrollbars>;
    }

    return <div className="ecos-dnd__placeholder">{placeholder}</div>;
  };

  render() {
    const { id, style, direction } = this.props;

    return (
      <DropWrapper droppableId={id} direction={direction}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} className={this.className(snapshot.isDraggingOver, snapshot.draggingFromThisWith)} style={style}>
            <React.Fragment>
              {this.renderChildren()}
              {/*{provided.placeholder}*/}
            </React.Fragment>
          </div>
        )}
      </DropWrapper>
    );
  }
}
