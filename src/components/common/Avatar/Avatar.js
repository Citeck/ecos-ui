import * as React from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon } from '../';

import './style.scss';

export default class Avatar extends React.Component {
  static propTypes = {
    url: PropTypes.string,
    theme: PropTypes.string,
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
      this.refImg.current.addEventListener('error', this.onError);
    }
  }

  componentWillUnmount() {
    if (this.refImg.current) {
      this.refImg.current.removeEventListener('error', this.onError);
    }
  }

  get empty() {
    const { url } = this.props;
    const { error } = this.state;

    return isEmpty(url) || error;
  }

  onError = error => {
    this.setState({ error: true });
  };

  renderContent() {
    const { url, userName } = this.props;

    if (!this.empty) {
      return <img alt="avatar" src={url} className={classNames(`${this.className}__image`)} ref={this.refImg} />;
    } else if (this.empty && userName) {
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
    const { className, classNameEmpty, theme } = this.props;

    return (
      <div className={classNames(this.className, `${this.className}_theme_${theme}`, className, { [classNameEmpty]: this.empty })}>
        {this.renderContent()}
      </div>
    );
  }
}
