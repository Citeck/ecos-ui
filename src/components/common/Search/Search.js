import React, { Component } from 'react';
import classNames from 'classnames';
import { t, trigger } from '../../../helpers/util';

import './Search.scss';

export default class Search extends Component {
  text = '';

  onPressBtn = () => {
    this.triggerSearch();
  };

  onKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        this.triggerSearch();
        break;
      default:
        break;
    }
  };

  onChange = e => {
    this.text = e.target.value;
  };

  triggerSearch = () => {
    trigger.call(this, 'onSearch', this.text);
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('search', props.className);

    return (
      <div className={cssClasses}>
        <label className="icon-search search__icon-search" onClick={this.onPressBtn} />
        <input type="text" placeholder={t('search.placeholder')} onChange={this.onChange} onKeyDown={this.onKeyDown} />
      </div>
    );
  }
}
