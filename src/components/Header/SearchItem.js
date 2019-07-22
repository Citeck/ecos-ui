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

  className = 'ecos-header-search-result';

  onClick = () => {
    const { data, onClick } = this.props;

    onClick(data);
  };

  render() {
    const { data } = this.props;
    const { icon, title, description, groupName, avatarUrl, isLast, isAvatar } = data || {};
    const cssContent = `${this.className}__content`;

    return groupName ? (
      <li className={`${this.className}__group-name`}>{groupName}</li>
    ) : (
      <li onClick={this.onClick} className={this.className}>
        <div className={classNames(cssContent, { [`${cssContent}_last`]: isLast })}>
          {icon && <Icon className={`${icon} ${cssContent}-icon`} />}
          {isAvatar && <Avatar url={avatarUrl} className={`${cssContent}-avatar`} />}
          <div className={`${cssContent}-data`}>
            <div className={`${cssContent}-title`}>{title}</div>
            <div className={`${cssContent}-desc`}>{description}</div>
          </div>
        </div>
        {!isLast && <Separator noIndents />}
      </li>
    );
  }
}
