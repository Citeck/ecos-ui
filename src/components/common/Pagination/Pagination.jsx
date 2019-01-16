import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '../buttons/Button/Button';

import './Pagination.scss';

export default class Pagination extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('pagination', props.className);

    return (
      <div {...props} className={cssClasses}>
        <span className={'pagination__text'}>1-10</span>
        <span className={'pagination__text'}> из </span>
        <span className={'pagination__text'}>28</span>

        <Button className="pagination__button">
          <i className="icon-left pagination__button-icon-left" />
        </Button>

        <Button className="pagination__button">
          <i className="icon-right pagination__button-icon-right" />
        </Button>
      </div>
    );
  }
}
