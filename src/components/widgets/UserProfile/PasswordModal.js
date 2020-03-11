import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../../helpers/util';

import './style.scss';
import EcosModal from '../../common/EcosModal';
import { Password } from '../../common';

const Labels = {
  Titles: {
    OLD: 'user-profile-widget.modal.password.old-password',
    NEW: 'user-profile-widget.modal.password.new-password',
    REPEAT: 'user-profile-widget.modal.password.repeat-new'
  }
};

class PasswordModal extends React.Component {
  static propTypes = {
    isShow: PropTypes.bool,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    className: '',
    items: []
  };

  state = {
    oldWord: '',
    newWord: '',
    repeatWord: ''
  };

  componentDidMount() {}

  handleHideModal = () => {
    this.props.onCancel && this.props.onCancel();
  };

  onChangeWord = (value, key) => {
    this.setState({ [key]: value });
  };

  render() {
    const { isShow } = this.props;
    const { oldWord, newWord, repeatWord } = this.state;

    return (
      <EcosModal isOpen={isShow} hideModal={this.handleHideModal} className="ecos-user-profile-password-modal">
        <div>{t(Labels.Titles.OLD)}</div>
        <div>
          <Password className="ecos-user-profile-password-modal__word" keyValue="oldWord" onChange={this.onChangeWord} value={oldWord} />
        </div>
        <div>{t(Labels.Titles.NEW)}</div>
        <div>
          <Password
            className="ecos-user-profile-password-modal__word"
            keyValue="newWord"
            onChange={this.onChangeWord}
            value={newWord}
            verifiable
          />
        </div>
        <div>{t(Labels.Titles.REPEAT)}</div>
        <div>
          <Password
            className="ecos-user-profile-password-modal__word"
            keyValue="repeatWord"
            onChange={this.onChangeWord}
            value={repeatWord}
          />
        </div>
      </EcosModal>
    );
  }
}

export default PasswordModal;
