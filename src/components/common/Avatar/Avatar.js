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
    userName: PropTypes.string,
    noBorder: PropTypes.bool
  };

  static defaultProps = {
    url: '',
    className: '',
    classNameEmpty: '',
    userName: ''
  };

  state = { error: '' };

  refImg = React.createRef();

  componentDidMount() {
    if (this.refImg.current) {
      this.refImg.current.onerror = this.onError;
    }
  }

  get empty() {
    const { url } = this.props;
    const { error } = this.state;

    return isEmpty(url) || error;
  }

  onError = error => {
    console.error(error);
    this.setState({ error: true });
  };

  renderContent() {
    const { url, userName } = this.props;

    if (!this.empty) {
      return <img alt="avatar" src={url} className="ecos-avatar__image" ref={this.refImg} onError={this.onError} />;
    } else if (this.empty && userName) {
      return (
        <div className="ecos-avatar__name">
          {userName
            .split(' ')
            .map(word => word[0])
            .join(' ')
            .toUpperCase()}
        </div>
      );
    } else {
      return <Icon className="ecos-avatar__icon icon-User_avatar" />;
    }
  }

  render() {
    const { className, classNameEmpty, theme, noBorder } = this.props;

    return (
      <div
        className={classNames('ecos-avatar', className, {
          [`ecos-avatar_theme_${theme}`]: !!theme,
          [classNameEmpty]: this.empty,
          'ecos-avatar_no-border': noBorder
        })}
      >
        {this.renderContent()}
      </div>
    );
  }
}
