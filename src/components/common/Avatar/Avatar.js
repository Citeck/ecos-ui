import * as React from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Icon } from '../';

import './style.scss';

export default class Avatar extends React.Component {
  static propTypes = {
    url: PropTypes.string,
    className: PropTypes.string
  };

  static defaultProps = {
    url: '',
    className: ''
  };

  className = 'ecos-avatar';

  render() {
    const { url, className: customClasses } = this.props;
    const className = `${customClasses} ${this.className}`;

    return (
      <div className={className}>
        {isEmpty(url) ? (
          <Icon className={`${this.className}__icon icon-User_avatar`} />
        ) : (
          <div className={`${this.className}__image`} style={{ backgroundImage: 'url(' + url + ')' }} />
        )}
      </div>
    );
  }
}
