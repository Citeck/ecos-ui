import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { changePassword, changePhoto, getUserData } from '../../../actions/user';
import { t } from '../../../helpers/util';
import Dashlet from '../../Dashlet';
import { Avatar, Loader } from '../../common';
// import { Badge } from '../../common/form';
import { Btn } from '../../common/btns';
import BaseWidget from '../BaseWidget';

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

  state = {};

  componentDidMount() {
    const { getUserData } = this.props;

    getUserData();
  }

  onChangePhoto = () => {
    this.props.changePhoto();
  };

  onChangePassword = () => {
    this.props.changePassword();
  };

  render() {
    const {
      title,
      classNameDashlet,
      profile: { lastName, firstName, middleName, isAdmin, userName, thumbnail },
      isCurrentUser,
      isLoading,
      isLoadingPhoto,
      isLoadingPassword
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
        {!isLoading && (
          <>
            <div className="ecos-user-profile__info">
              <Avatar className="ecos-user-profile__info-photo" userName={userName} url={thumbnail} noBorder />
              <div className="ecos-user-profile__info-name">
                <div className="ecos-user-profile__info-name-primary">{lastName}</div>
                <div className="ecos-user-profile__info-name-secondary">{[firstName, middleName].filter(name => !!name).join(' ')}</div>
              </div>
            </div>
            {/*{[isCurrentUser, isAdmin].some(flag => flag) && (*/}
            {/*  <div className="ecos-user-profile__badges">*/}
            {/*    /!*{isCurrentUser && <Badge text={t(Labels.YOU)} pill/>}*!/*/}
            {/*    {isAdmin && <Badge text={t(Labels.ADMIN)} pill/>}*/}
            {/*  </div>*/}
            {/*)}*/}
            {[isCurrentUser].some(flag => flag) && (
              <div className="ecos-user-profile__actions">
                <Btn loading={isLoadingPhoto} onClick={this.onChangePhoto}>
                  {t(Labels.Btns.CHANGE_PHOTO)}
                </Btn>
                <Btn loading={isLoadingPassword} onClick={this.onChangePassword}>
                  {t(Labels.Btns.CHANGE_PW)}
                </Btn>
              </div>
            )}
          </>
        )}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const { record } = context;
  const isCurrentUser = state.user.id === record;
  const profile = get(state, `userProfile.${record}`, {}) || {};

  return {
    isLoading: profile.isLoading,
    isLoadingPhoto: profile.isLoadingPhoto,
    isLoadingPassword: profile.isLoadingPassword,
    profile: profile.data || {},
    isCurrentUser
  };
};

const mapDispatchToProps = (dispatch, context) => {
  const { record } = context;
  const stateId = record;

  return {
    getUserData: () => dispatch(getUserData({ record, stateId })),
    changePassword: data => dispatch(changePassword({ data, record, stateId })),
    changePhoto: data => dispatch(changePhoto({ data, record, stateId }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserProfileDashlet);
