import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { changePassword, changePhoto, getUserData, togglePasswordModal } from '../../../actions/user';
import { t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { Avatar, BtnUpload, Loader } from '../../common';
import { Btn } from '../../common/btns';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import PasswordModal from './PasswordModal';

import './style.scss';

const Labels = {
  TITLE: 'user-profile-widget.title',
  ADMIN: 'user-profile-widget.label.admin',
  YOU: 'user-profile-widget.label.you',
  Btns: {
    CHANGE_PHOTO: 'user-profile-widget.button.change-photo',
    CHANGE_PW: 'user-profile-widget.button.change-password'
  }
};

class UserProfileDashlet extends BaseWidget {
  static propTypes = {
    className: PropTypes.string,
    record: PropTypes.string
  };

  static defaultProps = {
    classNameDashlet: ''
  };

  componentDidMount() {
    const { getUserData } = this.props;

    getUserData();
  }

  onChangePhoto = files => {
    if (files && files.length) {
      this.props.changePhoto(files[0]);
    }
  };

  onTogglePasswordModal = flag => {
    this.props.togglePasswordModal(flag);
  };

  onChangePassword = data => {
    this.props.changePassword(data);
  };

  render() {
    const {
      title,
      classNameDashlet,
      profile: { lastName, firstName, middleName, userName, thumbnail },
      isCurrentUser,
      isLoading,
      isLoadingPhoto,
      isLoadingPassword,
      isMobile,
      message,
      isCurrentAdmin,
      isOpenPasswordModal
    } = this.props;

    return (
      <Dashlet
        className={classNames('ecos-user-profile__dashlet', classNameDashlet)}
        bodyClassName="ecos-user-profile__dashlet-body"
        title={t(title || Labels.TITLE)}
        needGoTo={false}
        noActions
      >
        {isLoading && <Loader />}
        {
          <PasswordModal
            isLoading={isLoadingPassword}
            userName={userName}
            isCurrentUser={isCurrentUser}
            isAdmin={isCurrentAdmin}
            isMobile={isMobile}
            isShow={isOpenPasswordModal}
            onCancel={() => this.onTogglePasswordModal(false)}
            onChange={this.onChangePassword}
          />
        }
        {!isLoading && (
          <>
            <div className="ecos-user-profile__info">
              <Avatar className="ecos-user-profile__info-photo" userName={userName} url={thumbnail} noBorder />
              <div className="ecos-user-profile__info-name">
                <div className="ecos-user-profile__info-name-primary">{lastName}</div>
                <div className="ecos-user-profile__info-name-secondary">{[firstName, middleName].filter(name => !!name).join(' ')}</div>
              </div>
            </div>
            {[isCurrentUser, isCurrentAdmin].some(flag => flag) && (
              <div className={classNames('ecos-user-profile__actions', { 'ecos-user-profile__actions_mobile': isMobile })}>
                <BtnUpload label={t(Labels.Btns.CHANGE_PHOTO)} loading={isLoadingPhoto} onSelected={this.onChangePhoto} accept="image/*" />
                <Btn loading={isLoadingPassword} onClick={() => this.onTogglePasswordModal(true)}>
                  {t(Labels.Btns.CHANGE_PW)}
                </Btn>
              </div>
            )}
            {message && (
              <div className={classNames('ecos-user-profile__message', { 'ecos-user-profile__message_error': message.error })}>
                {t(message.text)}
              </div>
            )}
          </>
        )}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });
  const isCurrentUser = state.user.id === record;
  const profile = get(state, ['userProfile', stateId], {}) || {};

  return {
    isLoading: profile.isLoading,
    isLoadingPhoto: profile.isLoadingPhoto,
    isLoadingPassword: profile.isLoadingPassword,
    isOpenPasswordModal: profile.isOpenPasswordModal,
    profile: profile.data || {},
    message: profile.message,
    isCurrentUser,
    isMobile: state.view.isMobile,
    isCurrentAdmin: get(state, 'user.isAdmin', false)
  };
};

const mapDispatchToProps = (dispatch, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });

  return {
    getUserData: () => dispatch(getUserData({ record, stateId })),
    changePassword: data => dispatch(changePassword({ data, record, stateId })),
    changePhoto: data => dispatch(changePhoto({ data, record, stateId })),
    togglePasswordModal: isOpen => dispatch(togglePasswordModal({ isOpen, record, stateId }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserProfileDashlet);
