import React, { Component } from 'react';
import { ListGroup, ListGroupItem } from 'reactstrap';
import classNames from 'classnames';

import './List.scss';

export default class List extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-list-group', props.className);

    return (
      <ListGroup {...props} className={cssClasses}>
        {(props.list || []).map((item, index) => {
          return <ListGroupItem key={index}>{item}</ListGroupItem>;
        })}
      </ListGroup>
    );
  }
}
