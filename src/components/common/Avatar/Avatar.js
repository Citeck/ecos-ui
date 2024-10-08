import * as React from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from '../icons/Icon/Icon';

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

  state = { error: false };

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

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.url !== this.props.url) {
      this.setState({ error: false });
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
    const { url, userName, id } = this.props;

    if (!this.empty) {
      return <img alt="avatar" id={id} src={url} className="ecos-avatar__image" ref={this.refImg} onError={this.onError} />;
    } else if (this.empty && userName) {
      return (
        <div id={id} className="ecos-avatar__name">
          {userName
            .split(' ')
            .slice(0, 2)
            .map(word => word[0])
            .join(' ')
            .toUpperCase()}
        </div>
      );
    } else {
      return <Icon id={id} className="ecos-avatar__icon icon-user-normal" />;
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
