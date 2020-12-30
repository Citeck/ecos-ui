import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { changePhoto, getUserData, updAppUserData } from '../../../actions/user';
import { t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { Avatar, BtnUpload } from '../../common';
import { Btn } from '../../common/btns';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';

import './style.scss';
import RecordActions from '../../Records/actions/recordActions';
import { ActionTypes } from '../../Records/actions';

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
    super.componentDidMount();

    const { getUserData } = this.props;

    getUserData();
  }

  onChangePhoto = files => {
    if (files && files.length) {
      this.props.changePhoto(files[0]);
    }
  };

  onChangePassword = () => {
    RecordActions.execForRecord(this.props.record, { type: ActionTypes.EDIT_PASSWORD }).catch(console.error);
  };

  handleUpdate() {
    super.handleUpdate();
    this.props.getUserData();

    if (this.props.isCurrentUser) {
      this.props.updAppUserData();
    }
  }

  render() {
    const {
      title,
      classNameDashlet,
      profile: { lastName, firstName, middleName, userName, thumbnail },
      isCurrentUser,
      isLoading,
      isLoadingPhoto,
      isMobile,
      message,
      isCurrentAdmin
    } = this.props;
    const { isCollapsed } = this.state;

    return (
      <Dashlet
        className={classNames('ecos-user-profile__dashlet', classNameDashlet)}
        bodyClassName="ecos-user-profile__dashlet-body"
        title={t(title || Labels.TITLE)}
        needGoTo={false}
        noActions
        isLoading={isLoading}
        setRef={this.setDashletRef}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Scrollbars {...this.scrollbarProps}>
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
                  <BtnUpload
                    label={t(Labels.Btns.CHANGE_PHOTO)}
                    loading={isLoadingPhoto}
                    onSelected={this.onChangePhoto}
                    accept="image/*"
                  />
                  <Btn onClick={this.onChangePassword}>{t(Labels.Btns.CHANGE_PW)}</Btn>
                </div>
              )}
              {message && (
                <div className={classNames('ecos-user-profile__message', { 'ecos-user-profile__message_error': message.error })}>
                  {t(message.text)}
                </div>
              )}
            </>
          )}
        </Scrollbars>
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
    updAppUserData: () => dispatch(updAppUserData()),
    changePhoto: data => dispatch(changePhoto({ data, record, stateId }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserProfileDashlet);
