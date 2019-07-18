import * as React from 'react';
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

  className = 'ecos-header-search-result';

  render() {
    const { data } = this.props;
    const { icon, title, description, groupName, avatarUrl, isLast, isAvatar } = data || {};

    return groupName ? (
      <li className={`${this.className}__group-name`}>{groupName}</li>
    ) : (
      <React.Fragment>
        <li onClick={this.onClick} className={this.className}>
          {icon && <Icon className={`${icon} ${this.className}__icon`} />}
          {isAvatar && <Avatar url={avatarUrl} className={`${this.className}__avatar`} />}
          <div>
            <div className={`${this.className}__title`}>{title}</div>
            <div className={`${this.className}__desc`}>{description}</div>
          </div>
        </li>
        {!isLast && (
          <div className={`${this.className}__line`}>
            <Separator noIndents />
          </div>
        )}
      </React.Fragment>
    );
  }
}
