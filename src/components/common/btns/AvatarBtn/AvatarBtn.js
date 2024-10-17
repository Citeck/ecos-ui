import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Avatar } from '../../index';
import UserService from '../../../../services/UserService';
import { connect } from 'react-redux';

import './style.scss';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  userPhotoUrl: UserService.getAvatarUrl(state.user.thumbnail),
  theme: state.view.theme
});

class AvatarBtn extends Component {
  static propTypes = {
    icon: PropTypes.string,
    className: PropTypes.string
  };

  static defaultProps = {
    icon: '',
    className: ''
  };

  render() {
    const { className, icon, children, userFullName, theme, userPhotoUrl, ...props } = this.props;
    const cssClasses = classNames('ecos-btn ecos-btn_mi ecos-btn-with-avatar', className);

    return (
      <button {...props} className={cssClasses}>
        <Avatar className="ecos-btn-user-avatar" theme={theme} url={userPhotoUrl} />
        <span>{userFullName}</span>
        {icon && <i className={classNames('ecos-btn__i', icon)} />}
      </button>
    );
  }
}

export default connect(mapStateToProps)(AvatarBtn);
