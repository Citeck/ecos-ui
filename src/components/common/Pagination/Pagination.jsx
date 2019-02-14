import React, { Component } from 'react';
import classNames from 'classnames';
import { IcoBtn } from '../../common/btns';

import './Pagination.scss';

export default class Pagination extends Component {
  constructor(props) {
    super(props);

    this.state = { page: 1 };

    this.maxItems = props.maxItems || 10;
    this.max = 0;
    this.min = 0;
  }

  prev = () => {
    let page = this.state.page;

    if (page > 1) {
      page = page - 1;
      this.setState({ page: page });

      this.triggerChange(page);
    }
  };

  next = () => {
    if (this.max < this.props.total) {
      const page = this.state.page + 1;
      this.setState({ page: page });

      this.triggerChange(page);
    }
  };

  triggerChange = page => {
    const onChange = this.props.onChange;
    if (typeof onChange === 'function') {
      onChange({
        page: this.getMeta(page)
      });
    }
  };

  getMeta = page => {
    return {
      skipCount: (page - 1) * this.maxItems,
      maxItems: this.maxItems
    };
  };

  count = () => {
    let total = this.props.total;
    let maxItems = this.maxItems > total ? total : this.maxItems;
    let max = this.state.page * maxItems;
    let min = max === 0 ? 0 : max - maxItems + 1;

    this.max = max > total ? total : max;
    this.min = min;
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('pagination', props.className);

    this.count();

    return (
      <div className={cssClasses}>
        <span className={'pagination__text'}>
          {this.min}-{this.max}
        </span>
        <span className={'pagination__text'}> из </span>
        <span className={'pagination__text pagination__step'}>{props.total}</span>

        <IcoBtn icon={'icon-left'} className={'pagination__btn-step btn_grey3 btn_width_auto btn_hover_t-light-blue'} onClick={this.prev} />
        <IcoBtn icon={'icon-right'} className={'btn_grey3 btn_width_auto btn_hover_t-light-blue'} onClick={this.next} />
      </div>
    );
  }
}
