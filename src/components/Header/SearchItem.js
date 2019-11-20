import * as React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Avatar, Icon, Separator } from '../common';

export default class SearchItem extends React.PureComponent {
  static propTypes = {
    data: PropTypes.shape({
      icon: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      groupName: PropTypes.string
    }),
    onClick: PropTypes.func
  };

  static defaultProps = {
    data: {},
    onClick: () => {}
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
      <li onClick={this.onClick} className="ecos-header-search-result" data-separator={!isLast}>
        <div className={classNames('ecos-header-search-result__content', { 'ecos-header-search-result__content_last': isLast })}>
          {icon && <Icon className={`${icon} ecos-header-search-result__content-icon`} />}
          {isAvatar && <Avatar url={avatarUrl} className="ecos-header-search-result__content-avatar" />}
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
