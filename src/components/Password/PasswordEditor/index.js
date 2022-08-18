import React from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { EcosModal } from '../../common';
import { Btn } from '../../common/btns';
import PasswordField from '../PasswordField';

import './style.scss';
import { getFitnesseClassName } from '../../../helpers/tools';

const Labels = {
  Titles: {
    OLD: 'password-editor.label.old-password',
    NEW: 'password-editor.label.new-password',
    REPEAT: 'password-editor.label.repeat-new'
  },
  Buttons: {
    CANCEL: 'password-editor.button.cancel',
    CHANGE: 'password-editor.button.change'
  },
  Messages: {
    REPEATED_NOT_MATCH: 'password-editor.msg.new-passwords-not-match',
    NEW_EQ_OLD: 'password-editor.msg.new-n-old-passwords-match'
  }
};

class PasswordEditor extends React.Component {
  static propTypes = {
    isLoading: PropTypes.bool,
    isAdminEditor: PropTypes.bool,
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
    const { isAdminEditor } = this.props;
    const { oldWord, newWord, repeatWord, newWordMsgs, repeatWordMsgs } = this.state;

    return (
      !newWordMsgs.length &&
      !repeatWordMsgs.length &&
      (isAdminEditor || !!oldWord.value) &&
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
      newState.repeatWordMsgs.push(Labels.Messages.REPEATED_NOT_MATCH);
    }

    if (newWord.value && oldWord.value === newWord.value) {
      newState.newWordMsgs.push(Labels.Messages.NEW_EQ_OLD);
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
        className="ecos-password-editor__modal ecos-modal_width-xs"
      >
        <form autoComplete="off">
          {isCurrentUser && (
            <>
              <div className="ecos-password-editor__label">{t(Labels.Titles.OLD)}</div>
              <PasswordField
                className="ecos-password-editor__filed"
                type={passwordType}
                keyValue="oldWord"
                value={oldWord.value}
                onChange={this.onChangeWord}
                onBlur={this.checkFields}
              />
            </>
          )}
          <div className="ecos-password-editor__label">{t(Labels.Titles.NEW)}</div>
          <PasswordField
            verifiable
            type={passwordType}
            className="ecos-password-editor__filed"
            inputClassName={getFitnesseClassName('input-new', 'user-profile-password')}
            keyValue="newWord"
            value={newWord.value}
            onChange={this.onChangeWord}
            onBlur={this.checkFields}
            errMsgs={newWordMsgs}
          />
          <div className="ecos-password-editor__label">{t(Labels.Titles.REPEAT)}</div>
          <PasswordField
            type={passwordType}
            className="ecos-password-editor__filed"
            inputClassName={getFitnesseClassName('input-new-repeat', 'user-profile-password')}
            keyValue="repeatWord"
            value={repeatWord.value}
            onChange={this.onChangeWord}
            onBlur={this.checkFields}
            errMsgs={repeatWordMsgs}
          />
        </form>
        <div className="ecos-password-editor__actions">
          <Btn onClick={this.hideModal}>{t(Labels.Buttons.CANCEL)}</Btn>
          <Btn
            onClick={this.onConfirmChangePassword}
            className={classNames('ecos-btn_blue', getFitnesseClassName('save-button', 'user-profile-password'))}
            disabled={!this.checkWords()}
          >
            {t(Labels.Buttons.CHANGE)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default PasswordEditor;
