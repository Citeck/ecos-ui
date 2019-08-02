import * as React from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon } from '../';

import './style.scss';

export default class Avatar extends React.Component {
  static propTypes = {
    url: PropTypes.string,
    className: PropTypes.string,
    classNameEmpty: PropTypes.string,
    userName: PropTypes.string
  };

  static defaultProps = {
    url: '',
    className: '',
    classNameEmpty: '',
    userName: ''
  };

  className = 'ecos-avatar';

  state = { error: '' };

  refImg = React.createRef();

  componentDidMount() {
    if (this.refImg.current) {
      this.refImg.current.onerror = this.onError;
    }
  }

  onError = error => {
    this.setState({ error: true });
  };

  renderContent() {
    const { url, userName } = this.props;
    const { error } = this.state;
    const empty = isEmpty(url) || error;

    if (!empty) {
      return <img alt="avatar" src={url} className={classNames(`${this.className}__image`)} ref={this.refImg} />;
    } else if (empty && userName) {
      return (
        <div className={classNames(`${this.className}__name`)}>
          {userName
            .split(' ')
            .map(word => word[0])
            .join(' ')
            .toUpperCase()}
        </div>
      );
    } else {
      return <Icon className={classNames(`${this.className}__icon`, 'icon-User_avatar')} />;
    }
  }

  render() {
    const { url, className, classNameEmpty } = this.props;
    const { error } = this.state;
    const empty = isEmpty(url) || error;

    return <div className={classNames(this.className, className, { [classNameEmpty]: empty })}>{this.renderContent()}</div>;
  }
}
