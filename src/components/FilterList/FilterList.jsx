import React, { Component } from 'react';
import classNames from 'classnames';
import { ListGroup, ListGroupItem } from 'reactstrap';
import Button from '../common/buttons/Button/Button';

import './FilterList.scss';

export default class FilterList extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('filter-list', props.className);

    return (
      <div {...props} className={cssClasses}>
        <div className={'filter-list__toolbar'}>
          <Button className={'button_narrow button_light-blue filter-list__toolbar-button'}>Добавить критерий</Button>
          <Button className={'button_narrow button_light-blue filter-list__toolbar-button filter-list__toolbar-button_next'}>
            Добавить оператор
          </Button>
        </div>

        <div className={'filter-list__content'}>
          <ListGroup>
            <ListGroupItem> </ListGroupItem>
            <ListGroupItem> </ListGroupItem>
            <ListGroupItem> </ListGroupItem>
            <ListGroupItem> </ListGroupItem>
          </ListGroup>
        </div>
      </div>
    );
  }
}
