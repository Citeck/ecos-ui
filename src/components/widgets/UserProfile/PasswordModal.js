import React from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

import { t } from '../../../helpers/util';
import { EcosModal, Password } from '../../common';
import { Btn } from '../../common/btns';

import './style.scss';

const Labels = {
  Titles: {
    OLD: 'user-profile-widget.modal-password.label.old-password',
    NEW: 'user-profile-widget.modal-password.label.new-password',
    REPEAT: 'user-profile-widget.modal-password.label.repeat-new'
  },
  Btns: {
    CANCEL: 'user-profile-widget.modal-password.button.cancel',
    CHANGE: 'user-profile-widget.modal-password.button.change'
  },
  Msgs: {
    REPEATED_NOT_MATCH: 'user-profile-widget.modal-password.msg.new-passwords-not-match',
    NEW_EQ_OLD: 'user-profile-widget.modal-password.msg.new-n-old-passwords-match'
  }
};

class PasswordModal extends React.Component {
  static propTypes = {
    isLoading: PropTypes.bool,
    isAdmin: PropTypes.bool,
    isShow: PropTypes.bool,
    isMobile: PropTypes.bool,
    isCurrentUser: PropTypes.bool,
    userName: PropTypes.string,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    className: '',
    items: []
  };

  state = {
    oldWord: {},
    newWord: {},
    repeatWord: {},
    newWordMsgs: [],
    repeatWordMsgs: [],
    passwordType: window.PasswordCredential ? 'text' : 'password'
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.isShow && !this.props.isShow) {
      this.clearData();
    }
  }

  componentWillUnmount() {
    this.debouncedCheckFields.cancel();
  }

  hideModal = () => {
    this.props.onCancel && this.props.onCancel();
    this.clearData();
  };

  checkWords = () => {
    const { isAdmin } = this.props;
    const { oldWord, newWord, repeatWord, newWordMsgs, repeatWordMsgs } = this.state;

    return (
      !newWordMsgs.length &&
      !repeatWordMsgs.length &&
      (isAdmin || !!oldWord.value) &&
      !!repeatWord.value &&
      !!newWord.value &&
      newWord.valid &&
      newWord.value === repeatWord.value
    );
  };

  clearData = () => {
    this.setState({
      oldWord: {},
      newWord: {},
      repeatWord: {},
      newWordMsgs: [],
      repeatWordMsgs: [],
      passwordType: window.PasswordCredential ? 'text' : 'password'
    });
    this.debouncedCheckFields.cancel();
  };

  onConfirmChangePassword = () => {
    const { isCurrentUser, userName } = this.props;
    const { oldWord, newWord, repeatWord } = this.state;

    if (!window.PasswordCredential || !isCurrentUser) {
      this.props.onChange && this.props.onChange({ oldPass: oldWord.value, pass: newWord.value, passVerify: repeatWord.value });

      return;
    }

    const passwordCredential = new window.PasswordCredential({
      id: userName,
      password: newWord.value
    });

    navigator.credentials.store(passwordCredential);
    this.props.onChange && this.props.onChange({ oldPass: oldWord.value, pass: newWord.value, passVerify: repeatWord.value });
  };

  onChangeWord = ({ value, key, valid }) => {
    this.setState({ [key]: { value, valid } }, this.debouncedCheckFields);
  };

  checkFields = () => {
    const { oldWord, newWord, repeatWord } = this.state;
    const newState = {
      newWordMsgs: [],
      repeatWordMsgs: []
    };

    if (repeatWord.value && repeatWord.value !== newWord.value) {
      newState.repeatWordMsgs.push(Labels.Msgs.REPEATED_NOT_MATCH);
    }

    if (newWord.value && oldWord.value === newWord.value) {
      newState.newWordMsgs.push(Labels.Msgs.NEW_EQ_OLD);
    }

    this.setState({ ...newState });
  };

  debouncedCheckFields = debounce(this.checkFields, 500);

  render() {
    const { isShow, isCurrentUser, isLoading } = this.props;
    const { oldWord, newWord, repeatWord, repeatWordMsgs, newWordMsgs, passwordType } = this.state;

    return (
      <EcosModal
        noHeader
        isOpen={isShow}
        isLoading={isLoading}
        hideModal={this.hideModal}
        className="ecos-user-profile-password-modal ecos-modal_width-xs"
      >
        <form autoComplete="off">
          {isCurrentUser && (
            <>
              <div className="ecos-user-profile__password-modal-label">{t(Labels.Titles.OLD)}</div>
              <Password
                className="ecos-user-profile__password-modal-filed"
                type={passwordType}
                keyValue="oldWord"
                value={oldWord.value}
                onChange={this.onChangeWord}
                onBlur={this.checkFields}
              />
            </>
          )}
          <div className="ecos-user-profile__password-modal-label">{t(Labels.Titles.NEW)}</div>
          <Password
            verifiable
            type={passwordType}
            className="ecos-user-profile__password-modal-filed"
            keyValue="newWord"
            value={newWord.value}
            onChange={this.onChangeWord}
            onBlur={this.checkFields}
            errMsgs={newWordMsgs}
          />
          <div className="ecos-user-profile__password-modal-label">{t(Labels.Titles.REPEAT)}</div>
          <Password
            type={passwordType}
            className="ecos-user-profile__password-modal-filed"
            keyValue="repeatWord"
            value={repeatWord.value}
            onChange={this.onChangeWord}
            onBlur={this.checkFields}
            errMsgs={repeatWordMsgs}
          />
        </form>
        <div className="ecos-user-profile__password-modal-actions">
          <Btn onClick={this.hideModal}>{t(Labels.Btns.CANCEL)}</Btn>
          <Btn onClick={this.onConfirmChangePassword} className="ecos-btn_blue" disabled={!this.checkWords()}>
            {t(Labels.Btns.CHANGE)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default PasswordModal;
