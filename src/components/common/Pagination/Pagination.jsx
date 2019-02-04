import React, { Component } from 'react';
import classNames from 'classnames';
import { IcoBtn } from '../../common/btns';

import './Pagination.scss';

export default class Pagination extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('pagination', props.className);

    return (
      <div {...props} className={cssClasses}>
        <span className={'pagination__text'}>1-10</span>
        <span className={'pagination__text'}> из </span>
        <span className={'pagination__text pagination__step'}>28</span>

        <IcoBtn icon={'icon-left'} className={'pagination__btn-step btn_grey3 btn_width_auto btn_hover_t-light-blue'} />
        <IcoBtn icon={'icon-right'} className={'btn_grey3 btn_width_auto btn_hover_t-light-blue'} />
      </div>
    );
  }
}
