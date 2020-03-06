import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { getUserData } from '../../../actions/user';
import { t } from '../../../helpers/util';
import Dashlet from '../../Dashlet';
import { Avatar } from '../../common';
import { Badge } from '../../common/form';
import { Btn } from '../../common/btns';
import BaseWidget from '../BaseWidget';

import './style.scss';

const Labels = {
  TITLE: 'user-profile-widget.title',
  ADMIN: 'user-profile-widget.label.admin',
  YOU: 'user-profile-widget.label.it-is-you',
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
    if (!this.props.isYou) {
      this.props.getUserData(this.props.record);
    }
  }

  onChangePhoto = () => {};

  onChangePassword = () => {};

  render() {
    const {
      title,
      classNameDashlet,
      user: { lastName, firstName, middleName, isAdmin, userName, thumbnail },
      isYou
    } = this.props;

    return (
      <Dashlet
        className={classNames('ecos-user-profile__dashlet', classNameDashlet)}
        bodyClassName="ecos-user-profile__dashlet-body"
        title={t(title || Labels.TITLE)}
        needGoTo={false}
        noActions
      >
        <div className="ecos-user-profile__info">
          <Avatar className="ecos-user-profile__info-photo" userName={userName} url={thumbnail} noBorder />
          <div className="ecos-user-profile__info-name">
            <div className="ecos-user-profile__info-name-primary">{lastName}</div>
            <div className="ecos-user-profile__info-name-secondary">{[firstName, middleName].filter(name => !!name).join(' ')}</div>
          </div>
        </div>
        <div className="ecos-user-profile__badges">
          {isYou && <Badge text={t(Labels.YOU)} pill />}
          {isAdmin && <Badge text={t(Labels.ADMIN)} pill />}
        </div>
        <div className="ecos-user-profile__actions">
          <Btn onClick={this.onChangePhoto}>{t(Labels.Btns.CHANGE_PHOTO)}</Btn>
          <Btn onClick={this.onChangePassword}>{t(Labels.Btns.CHANGE_PW)}</Btn>
        </div>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const isYou = state.user.nodeRef === context.record || !context.record;

  return {
    user: isYou ? state.user : get(state, `userProfile.${context.record}`, {}),
    isYou
  };
};

const mapDispatchToProps = dispatch => ({
  getUserData: record => dispatch(getUserData(record))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserProfileDashlet);
