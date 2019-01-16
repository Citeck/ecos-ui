import React, { Component } from 'react';
import { ListGroup, ListGroupItem } from 'reactstrap';

import './List.scss';

export default class List extends Component {
  render() {
    const props = this.props;

    return (
      <ListGroup {...props} className={props.className}>
        {(props.list || []).map((item, index) => {
          return <ListGroupItem key={index}>{item}</ListGroupItem>;
        })}
      </ListGroup>
    );
  }
}
