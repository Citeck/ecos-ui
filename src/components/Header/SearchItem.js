import * as React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { Avatar, Icon, Separator } from '../common';

export default class SearchItem extends React.PureComponent {
  static propTypes = {
    data: PropTypes.shape({
      icon: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      groupName: PropTypes.string
    }),
    onClick: PropTypes.func,
    maxWidth: PropTypes.number
  };

  static defaultProps = {
    data: {},
    onClick: () => {}
  };

  checkStyle = current => {
    const { maxWidth } = this.props;

    if (!current || !maxWidth) {
      return;
    }

    const leftBlock = current.querySelector('.ecos-header-search-result__content-left');
    const data = current.querySelector('.ecos-header-search-result__content-data');
    let indent = parseInt(window.getComputedStyle(current, null).getPropertyValue('padding-left'), 10);

    indent += parseInt(window.getComputedStyle(current, null).getPropertyValue('padding-right'), 10);
    indent += get(leftBlock, 'offsetWidth', 0);

    if (data.offsetWidth > maxWidth - indent) {
      data.style.whiteSpace = 'pre-wrap';
      data.style.width = `${maxWidth - indent}px`;
    } else {
      data.style.whiteSpace = 'nowrap';
    }
  };

  onClick = () => {
    const { data, onClick } = this.props;

    onClick(data);
  };

  render() {
    const { data } = this.props;
    const { icon, title, description, groupName, avatarUrl, isLast, isAvatar } = data || {};

    return groupName ? (
      <li className="ecos-header-search-result__group-name">{groupName}</li>
    ) : (
      <li onClick={this.onClick} className="ecos-header-search-result" data-separator={!isLast} ref={this.checkStyle}>
        <div className={classNames('ecos-header-search-result__content', { 'ecos-header-search-result__content_last': isLast })}>
          <div className="ecos-header-search-result__content-left">
            {icon && <Icon className={`${icon} ecos-header-search-result__content-icon`} />}
            {isAvatar && <Avatar url={avatarUrl} className="ecos-header-search-result__content-avatar" />}
          </div>
          <div className="ecos-header-search-result__content-data">
            <div className="ecos-header-search-result__content-title">{title}</div>
            <div className="ecos-header-search-result__content-desc">{description}</div>
          </div>
        </div>
        {!isLast && <Separator noIndents />}
      </li>
    );
  }
}
