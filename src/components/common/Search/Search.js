import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t, trigger } from '../../../helpers/util';
import { Icon } from '../index';

import './Search.scss';

export default class Search extends Component {
  static propTypes = {
    className: PropTypes.string,
    collapsed: PropTypes.bool,
    cleaner: PropTypes.bool
  };

  state = {
    text: '',
    collapsed: false
  };

  constructor(props) {
    super(props);

    this.state.collapsed = !!props.collapsed;
  }

  onPressBtn = () => {
    if (this.state.collapsed) {
      this.setState({ collapsed: false });
    } else {
      this.triggerSearch();
    }
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
    const text = e.target.value;

    if (this.state.text !== text) {
      this.setState({ text });
    }
  };

  onClean = () => {
    this.setState(state => {
      const st = {};

      if (state.text) {
        st.text = '';
      }

      if (this.props.collapsed && !state.collapsed) {
        st.text = true;
      }

      return st;
    });
  };

  triggerSearch = () => {
    if (this.state.text) {
      trigger.call(this, 'onSearch', this.state.text);
    }
  };

  render() {
    const { className, cleaner } = this.props;
    const { collapsed, text } = this.state;
    const cssClasses = classNames('search', { search_collapsed: collapsed }, className);

    return (
      <div className={cssClasses}>
        <Icon className="icon-search search__icon-search" onClick={this.onPressBtn} />
        <input
          className={classNames('search__input', { 'search__input_with-cleaner': cleaner && text })}
          type="text"
          placeholder={t('search.placeholder')}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          value={text}
        />
        {cleaner && text && <Icon className="icon-close search__icon-cleaner" onClick={this.onClean} />}
      </div>
    );
  }
}
