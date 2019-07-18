import * as React from 'react';
import { Icon, Separator } from '../index';
import PropTypes from 'prop-types';

export default class SearchItem extends React.PureComponent {
  static propTypes = {
    data: PropTypes.shape({
      icon: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      groupName: PropTypes.string
    }),
    isLast: PropTypes.bool,
    onClick: PropTypes.func
  };

  static defaultProps = {
    data: {},
    isLast: false,
    onClick: () => {}
  };

  onClick = () => {
    const { data, onClick } = this.props;

    onClick(data);
  };

  className = 'ecos-input-search-result';

  render() {
    const { isLast, data } = this.props;
    const { icon, title, description, groupName } = data || {};

    return groupName ? (
      <li className={`${this.className}__group-name`}>{groupName}</li>
    ) : (
      <React.Fragment>
        <li onClick={this.onClick} className={this.className}>
          {icon && <Icon className={`${icon} ${this.className}__icon`} />}
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
