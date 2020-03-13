import React from 'react';
import PropTypes from 'prop-types';

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
    isShow: PropTypes.bool,
    isMobile: PropTypes.bool,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    className: '',
    items: []
  };

  state = {
    oldWord: '',
    newWord: '',
    repeatWord: '',
    newWordMsgs: [],
    repeatWordMsgs: []
  };

  hideModal = () => {
    this.props.onCancel && this.props.onCancel();
  };

  checkWords = () => {
    const { oldWord, newWord, repeatWord, newWordMsgs, repeatWordMsgs } = this.state;

    return !newWordMsgs.length && !repeatWordMsgs.length && !!oldWord.value && !!repeatWord.value && !!newWord.value && newWord.valid;
  };

  onConfirmChangePassword = () => {
    const { oldWord, newWord } = this.state;

    this.props.onChange && this.props.onChange({ oldWord, newWord });
  };

  onChangeWord = ({ value, key, valid }) => {
    this.setState({ [key]: { value, valid } });
  };

  checkNewWord = () => {
    const { oldWord, newWord } = this.state;
    const newWordMsgs = [];

    if (newWord.value && oldWord.value === newWord.value) {
      newWordMsgs.push(Labels.Msgs.NEW_EQ_OLD);
    }

    this.setState({ newWordMsgs });
  };

  checkRepeatWord = () => {
    const { repeatWord, newWord } = this.state;
    const repeatWordMsgs = [];

    if (repeatWord.value && repeatWord.value !== newWord.value) {
      repeatWordMsgs.push(Labels.Msgs.REPEATED_NOT_MATCH);
    }

    this.setState({ repeatWordMsgs });
  };

  render() {
    const { isShow } = this.props;
    const { oldWord, newWord, repeatWord, repeatWordMsgs, newWordMsgs } = this.state;

    return (
      <EcosModal noHeader isOpen={isShow} hideModal={this.hideModal} className="ecos-user-profile-password-modal ecos-modal_width-xs">
        <div className="ecos-user-profile__password-modal-label">{t(Labels.Titles.OLD)}</div>
        <Password
          className="ecos-user-profile__password-modal-filed"
          keyValue="oldWord"
          value={oldWord.value}
          onChange={this.onChangeWord}
        />
        <div className="ecos-user-profile__password-modal-label">{t(Labels.Titles.NEW)}</div>
        <Password
          verifiable
          className="ecos-user-profile__password-modal-filed"
          keyValue="newWord"
          value={newWord.value}
          onChange={this.onChangeWord}
          onBlur={this.checkNewWord}
          errMsgs={newWordMsgs}
        />
        <div className="ecos-user-profile__password-modal-label">{t(Labels.Titles.REPEAT)}</div>
        <Password
          className="ecos-user-profile__password-modal-filed"
          keyValue="repeatWord"
          value={repeatWord.value}
          onChange={this.onChangeWord}
          onBlur={this.checkRepeatWord}
          errMsgs={repeatWordMsgs}
        />
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
