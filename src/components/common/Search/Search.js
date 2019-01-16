import React, { Component } from 'react';
import classNames from 'classnames';

import './Search.scss';

export default class Search extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('search', props.className);

    return (
      <div className={cssClasses}>
        <label className="icon-search search__icon-search">
          <input type="text" placeholder={'Найти'} />
        </label>
      </div>
    );
  }
}
