import React, { Component } from 'react';
import classNames from 'classnames';
import { ListGroup, ListGroupItem } from 'reactstrap';
import { t } from '../../helpers/util';

import './FilterList.scss';

export default class FilterList extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('filter-list', props.className);

    return (
      <div {...props} className={cssClasses}>
        <div className={'filter-list__toolbar'}>
          <span className={'filter-list__desc'}>{t('filter-list.add-criterion')}</span>
          <span className={'filter-list__desc'}>{t('filter-list.add-operator')}</span>
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
