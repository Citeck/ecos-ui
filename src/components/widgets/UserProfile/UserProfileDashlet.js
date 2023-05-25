import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';

import { changePhoto, getUserData, updAppUserData } from '../../../actions/user';
import { t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { Avatar, BtnUpload } from '../../common';
import { Btn } from '../../common/btns';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Records from '../../Records';
import RecordActions from '../../Records/actions/recordActions';
import { ActionTypes } from '../../Records/actions/constants';
import { getFitnesseClassName } from '../../../helpers/tools';

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

  constructor(props) {
    super(props);

    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'avatar', 'photo'])];
  }

  componentDidMount() {
    super.componentDidMount();

    const { getUserData } = this.props;

    isFunction(getUserData) && getUserData();
  }

  componentDidUpdate(prevProps) {
    const { getUserData, record, isCurrentUser = false } = this.props;

    if (prevProps.record !== record) {
      return isFunction(getUserData) && getUserData();
    }

    if (isCurrentUser && !isEmpty(record)) {
      const lastPhotoUrl = prevProps.profile.thumbnail;

      Records.get(record)
        .load('avatar?json')
        .then(data => {
          if (data && lastPhotoUrl && data.url !== lastPhotoUrl) {
            this.handleUpdate();
          }
        });
    }
  }

  onChangePhoto = files => {
    const { changePhoto } = this.props;

    if (files && files.length) {
      isFunction(changePhoto) && changePhoto(files[0]);
    }
  };

  onChangePassword = () => {
    RecordActions.execForRecord(this.props.record, {
      type: ActionTypes.EDIT_PASSWORD
    }).catch(console.error);
  };

  handleUpdate() {
    super.handleUpdate();

    const { getUserData, updAppUserData, isCurrentUser = false } = this.props;

    isFunction(getUserData) && getUserData();

    if (isCurrentUser) {
      isFunction(updAppUserData) && updAppUserData();
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
        isCollapsed={this.isCollapsed}
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
                    className={getFitnesseClassName('user-profile-widget', 'change-photo')}
                    label={t(Labels.Btns.CHANGE_PHOTO)}
                    loading={isLoadingPhoto}
                    onSelected={this.onChangePhoto}
                    accept="image/*"
                  />
                  <Btn className={getFitnesseClassName('user-profile-widget', 'change-password')} onClick={this.onChangePassword}>
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
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });
  const profile = get(state, ['userProfile', stateId], {}) || {};

  const isCurrentUser = get(state, 'user.recordRef') === record;

  return {
    isLoading: profile.isLoading,
    isLoadingPhoto: profile.isLoadingPhoto,
    profile: profile.data || {},
    message: profile.message,
    isCurrentUser,
    isMobile: get(state, 'view.isMobile', false),
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
