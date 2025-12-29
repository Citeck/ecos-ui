import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import EcosModal from '../../common/EcosModal';
import { t } from '../../../helpers/util';
import Radio from '../../common/form/Radio';
import Btn from '../../common/btns/Btn/Btn';
import { VERSIONS } from '../../../constants/versionsJournal';

const LABELS = {
  CANCEL: 'versions-journal-widget.modal.cancel',
  ADD: 'versions-journal-widget.modal.save',

  VERSION_MINOR: 'versions-journal-widget.modal.version_minor',
  VERSION_MAJOR: 'versions-journal-widget.modal.version_major',

  COMMENT_TITLE: 'versions-journal-widget.modal.comment_title',
  COMMENT_PLACEHOLDER: [
    'versions-journal-widget.modal.comment_placeholder_not_necessary',
    'versions-journal-widget.modal.comment_placeholder_no_more',
    'versions-journal-widget.modal.comment_placeholder_characters'
  ]
};

class ChangeVersionModal extends Component {
  static propTypes = {
    isShow: PropTypes.bool,
    isLoading: PropTypes.bool,
    onHideModal: PropTypes.func,
    title: PropTypes.string,
    currentVersion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    commentMaxLength: PropTypes.number,
    errorMessage: PropTypes.string
  };

  static defaultProps = {
    isShow: false,
    isLoading: false,
    onHideModal: () => {},
    title: '',
    currentVersion: 1,
    commentMaxLength: 200,
    errorMessage: ''
  };

  state = {
    selectedVersion: VERSIONS.MINOR,
    comment: '',
    isMajorVersion: false
  };

  get isValidComment() {
    const { commentMaxLength } = this.props;
    const { comment } = this.state;

    return comment.length <= commentMaxLength;
  }

  getVersion(oldVersion, isMajor = false) {
    const version = Number(oldVersion);
    let result = 1;

    if (isMajor) {
      result = Math.floor(version + 1);
    } else {
      let [major, minor] = oldVersion.toString().split('.');

      result = `${major}.${+minor + 1}`;
    }

    return Number.isInteger(result) ? `${result}.0` : result;
  }

  handleHideModal = () => {
    this.props.onHideModal();
    this.setState({
      selectedVersion: VERSIONS.MINOR,
      comment: ''
    });
  };

  handleChangeComment = event => {
    this.setState({ comment: event.target.value });
  };

  handleSave = () => {
    const { onCreate } = this.props;
    const { comment, selectedVersion } = this.state;

    onCreate({
      comment,
      isMajor: selectedVersion === VERSIONS.MAJOR
    });
  };

  renderVersions() {
    const { currentVersion } = this.props;
    const { selectedVersion } = this.state;

    return (
      <div className="vj-modal__radio vj-modal__radio_first-block">
        <Radio
          key={VERSIONS.MINOR}
          label={`${t(LABELS.VERSION_MINOR)} (v ${this.getVersion(currentVersion)})`}
          name="version-radio"
          checked={selectedVersion === VERSIONS.MINOR}
          onChange={isChecked => {
            if (isChecked) {
              this.setState({
                selectedVersion: VERSIONS.MINOR
              });
            }
          }}
        />
        <Radio
          key={VERSIONS.MAJOR}
          label={`${t(LABELS.VERSION_MAJOR)} (v ${this.getVersion(currentVersion, true)})`}
          name="version-radio"
          checked={selectedVersion === VERSIONS.MAJOR}
          onChange={isChecked => {
            if (isChecked) {
              this.setState({
                selectedVersion: VERSIONS.MAJOR
              });
            }
          }}
        />
      </div>
    );
  }

  renderComment() {
    const { commentMaxLength } = this.props;
    const { comment } = this.state;

    return (
      <div className="vj-modal__comment">
        <div className="vj-modal__comment-header">
          <div className="vj-modal__comment-title">{t(LABELS.COMMENT_TITLE)}</div>
          <div className="vj-modal__comment-counter">
            <div
              className={classNames('vj-modal__comment-counter-number', {
                'vj-modal__comment-counter-number_error': comment.length > commentMaxLength
              })}
            >
              {comment.length}
            </div>
            <div className="vj-modal__comment-counter-number">{commentMaxLength}</div>
          </div>
        </div>
        <div className="vj-modal__comment-body">
          <textarea
            placeholder={`${t(LABELS.COMMENT_PLACEHOLDER[0])} (${t(LABELS.COMMENT_PLACEHOLDER[1])} ${commentMaxLength} ${t(
              LABELS.COMMENT_PLACEHOLDER[2]
            )})`}
            className="vj-modal__comment-input"
            onChange={this.handleChangeComment}
            defaultValue={comment}
          />
        </div>
      </div>
    );
  }

  renderActionButtons() {
    const { selectedVersion } = this.state;

    return (
      <div className="vj-modal__footer">
        <Btn className="ecos-btn_grey ecos-btn_hover_grey vj-modal__btn-cancel" onClick={this.handleHideModal}>
          {t(LABELS.CANCEL)}
        </Btn>
        <Btn
          className="ecos-btn_blue ecos-btn_hover_light-blue vj-modal__btn-add"
          onClick={this.handleSave}
          disabled={!this.isValidComment || !selectedVersion}
        >
          {t(LABELS.ADD)}
        </Btn>
      </div>
    );
  }

  renderErrorMessage() {
    const { errorMessage } = this.props;

    if (!errorMessage) {
      return null;
    }

    return <div className="vj-modal__error">{errorMessage}</div>;
  }

  render() {
    const { isShow, title, isLoading } = this.props;

    return (
      <EcosModal
        isOpen={isShow}
        isLoading={isLoading}
        hideModal={this.handleHideModal}
        title={title}
        className="vj-modal"
        reactstrapProps={{ backdrop: 'static', keyboard: true }}
      >
        {this.renderErrorMessage()}
        {this.renderVersions()}
        {this.renderComment()}
        {this.renderActionButtons()}
      </EcosModal>
    );
  }
}

export default ChangeVersionModal;
