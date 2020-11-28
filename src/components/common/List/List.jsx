import React, { Component } from 'react';
import { ListGroup, ListGroupItem } from 'reactstrap';
import classNames from 'classnames';

import './List.scss';

export default class List extends Component {
  render() {
    const { selected, forwardedRef, ...props } = this.props;
    const cssClasses = classNames('ecos-list-group', props.className);

    return (
      <div ref={forwardedRef}>
        <ListGroup {...props} className={cssClasses}>
          {(props.list || []).map((item, index) => {
            const selectedClass = index === selected ? 'list-group-item_selected' : '';
            return (
              <ListGroupItem key={index} className={selectedClass}>
                {item}
              </ListGroupItem>
            );
          })}
        </ListGroup>
      </div>
    );
  }
}
