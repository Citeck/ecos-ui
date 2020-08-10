import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { FileStatuses } from '../../../helpers/ecosXhr';
import { VERSIONS } from '../../../constants/versionsJournal';
import { Loader } from '../../common';
import EcosModal from '../../common/EcosModal';
import Radio from '../../common/form/Radio';
import Btn from '../../common/btns/Btn/Btn';

import './style.scss';

const Labels = {
  DROPZONE_PLACEHOLDER: 'versions-journal-widget.modal.dropzone_placeholder',
  DROPZONE_BUTTON_SELECT: 'versions-journal-widget.modal.dropzone_button_select',
  DROPZONE_BUTTON_CANCEL: 'versions-journal-widget.modal.dropzone_button_cancel',

  CANCEL: 'versions-journal-widget.modal.cancel',
  ADD: 'versions-journal-widget.modal.add',

  VERSION_MINOR: 'versions-journal-widget.modal.version_minor',
  VERSION_MAJOR: 'versions-journal-widget.modal.version_major',

  COMMENT_TITLE: 'versions-journal-widget.modal.comment_title',
  COMMENT_PLACEHOLDER: [
    'versions-journal-widget.modal.comment_placeholder_not_necessary',
    'versions-journal-widget.modal.comment_placeholder_no_more',
    'versions-journal-widget.modal.comment_placeholder_characters'
  ],

  Messages: {
    ERROR_FILE_SIZE_MIN: 'versions-journal-widget.modal.error-file-size',
    ERROR_FILE_UPLOAD: 'versions-journal-widget.modal.error-file-upload',
    ERROR_FILE_ABORTED: 'versions-journal-widget.modal.error-file-aborted',
    ERROR_FILE_NOT_CHOSEN: 'versions-journal-widget.modal.error-file-not-chosen',
    ERROR_FILE_ONLY_ONE: 'versions-journal-widget.modal.error-file-only-one'
  }
};

class AddModal extends Component {
  static propTypes = {
    isShow: PropTypes.bool,
    isLoadingModal: PropTypes.bool,
    isLoading: PropTypes.bool,
    onHideModal: PropTypes.func,
    title: PropTypes.string,
    currentVersion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    commentMaxLength: PropTypes.number,
    errorMessage: PropTypes.string,
    className: PropTypes.string
  };

  static defaultProps = {
    isShow: false,
    isLoadingModal: false,
    isLoading: false,
    onHideModal: () => {},
    title: '',
    currentVersion: 1,
    commentMaxLength: 200,
    errorMessage: '',
    className: ''
  };

  state = {
    ...this.initStateFile,
    selectedVersion: VERSIONS.MINOR,
    comment: '',
    isMajorVersion: false
  };

  dropzoneRef = React.createRef();

  get initStateFile() {
    return {
      file: null,
      xhr: null,
      fileStatus: '',
      filePercent: 0,
      clientError: ''
    };
  }

  get isValidComment() {
    const { commentMaxLength } = this.props;
    const { comment } = this.state;

    return comment.length <= commentMaxLength;
  }

  get disabledForm() {
    return this.props.isLoading;
  }

  getVersion(oldVersion, isMajor = false) {
    const version = Number(oldVersion);
    let result = 1;

    if (isMajor) {
      result = Math.floor(version + 1);
    } else {
      const [major, minor] = oldVersion.toString().split('.');

      result = Number.isNaN(+minor) ? `${major}.0` : `${major}.${+minor + 1}`;
    }

    return Number.isInteger(result) ? `${result}.0` : result;
  }

  validateUploadedFile = file => {
    let clientError = [];
    if (!file) {
      clientError.push(t(Labels.Messages.ERROR_FILE_NOT_CHOSEN));
      clientError.push(t(Labels.Messages.ERROR_FILE_ONLY_ONE));
    } else if (!file.size) {
      const arrMsg = t(Labels.Messages.ERROR_FILE_SIZE_MIN).split('VAL');
      const vals = [file.name, file.size];
      const msg = arrMsg.map((item, i) => item + get(vals, i.toString(), ''));

      clientError.push(msg.join(''));
    }

    return clientError.join(' ');
  };

  handleChangeStatus = (state, xhr) => {
    const { clientError: _clientError } = this.state;
    const { status: fileStatus, percent: filePercent, response = {} } = state;
    let newState = { fileStatus, filePercent };

    switch (fileStatus) {
      case FileStatuses.PREPARING:
        newState.clientError = '';
        newState.xhr = xhr;
        break;
      case FileStatuses.DONE:
        newState = {
          ...this.initStateFile,
          ...newState
        };
        break;
      case FileStatuses.ABORTED:
        newState = {
          ...this.initStateFile,
          ...newState,
          clientError: t(Labels.Messages.ERROR_FILE_ABORTED)
        };
        break;
      case FileStatuses.ERROR_UPLOAD:
        const { message = '', status = '' } = response || {};
        const { description = '' } = status || {};
        const clientError = `${t(Labels.Messages.ERROR_FILE_UPLOAD)} ${message} ${description}`;

        if (_clientError !== clientError) {
          newState = {
            ...this.initStateFile,
            ...newState,
            clientError
          };
        }
        break;
      default:
        break;
    }

    this.setState(newState);
  };

  handleHideModal = () => {
    this.props.onHideModal();
    this.setState({
      ...this.initStateFile,
      selectedVersion: VERSIONS.MINOR,
      comment: ''
    });
  };

  handleChangeComment = event => {
    this.setState({ comment: event.target.value });
  };

  handleSave = () => {
    const { file, comment, selectedVersion } = this.state;

    this.props.onCreate({
      file,
      comment,
      isMajor: selectedVersion === VERSIONS.MAJOR,
      handleProgress: this.handleChangeStatus
    });
  };

  handleDropFile = acceptedFiles => {
    const [file = null] = acceptedFiles;
    const clientError = this.validateUploadedFile(file);

    if (clientError) {
      this.setState({ file: null, clientError });
    } else {
      this.setState({ file, clientError: '' });
    }
  };

  handleOpenFileDialog = () => {
    if (this.dropzoneRef && this.dropzoneRef.current) {
      this.dropzoneRef.current.open();
    }
  };

  renderDropzoneInputContent() {
    return (
      <div className="vj-modal__dropzone-label">
        <div className="vj-modal__dropzone-label-in">{t(Labels.DROPZONE_PLACEHOLDER)}</div>
        <div className="vj-modal__dropzone-button" onClick={this.handleOpenFileDialog}>
          {t(Labels.DROPZONE_BUTTON_SELECT)}
        </div>
      </div>
    );
  }

  renderProgressBar() {
    const { filePercent, xhr } = this.state;
    const cancelUpload = () => {
      xhr && xhr.abort();
    };

    return (
      <div className="vj-modal__dropzone-uploading">
        <progress max="100" value={filePercent} className="vj-modal__progress-bar" />
        <div className="vj-modal__dropzone-button" onClick={cancelUpload}>
          {t(Labels.DROPZONE_BUTTON_CANCEL)}
        </div>
      </div>
    );
  }

  renderDropzone() {
    const { isLoading } = this.props;

    return (
      <>
        <Dropzone ref={this.dropzoneRef} multiple={false} onDrop={this.handleDropFile} noClick noKeyboard disabled={isLoading}>
          {({ getRootProps, getInputProps, isDragActive }) => {
            return (
              <div
                className={classNames('vj-modal__dropzone', {
                  'vj-modal__dropzone_active': isDragActive,
                  'vj-modal__dropzone_loading': isLoading
                })}
                {...getRootProps()}
                onClick={event => event.preventDefault()}
              >
                <input {...getInputProps()} />
                {!isLoading && this.renderDropzoneInputContent()}
                {isLoading && this.renderProgressBar()}
              </div>
            );
          }}
        </Dropzone>
      </>
    );
  }

  renderVersions() {
    const { currentVersion } = this.props;
    const { selectedVersion } = this.state;

    return (
      <div className="vj-modal__radio">
        <Radio
          key={VERSIONS.MINOR}
          label={`${t(Labels.VERSION_MINOR)} (v ${this.getVersion(currentVersion)})`}
          name="version-radio"
          checked={selectedVersion === VERSIONS.MINOR}
          disabled={this.disabledForm}
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
          label={`${t(Labels.VERSION_MAJOR)} (v ${this.getVersion(currentVersion, true)})`}
          name="version-radio"
          checked={selectedVersion === VERSIONS.MAJOR}
          disabled={this.disabledForm}
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

  renderFile() {
    const { file } = this.state;

    if (!file) {
      return null;
    }

    return <div className="vj-modal__file">{file.name}</div>;
  }

  renderComment() {
    const { commentMaxLength } = this.props;
    const { comment } = this.state;

    return (
      <div className="vj-modal__comment">
        <div className="vj-modal__comment-header">
          <div className="vj-modal__comment-title">{t(Labels.COMMENT_TITLE)}</div>
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
            placeholder={`${t(Labels.COMMENT_PLACEHOLDER[0])} (${t(Labels.COMMENT_PLACEHOLDER[1])} ${commentMaxLength} ${t(
              Labels.COMMENT_PLACEHOLDER[2]
            )})`}
            className="vj-modal__comment-input"
            onChange={this.handleChangeComment}
            defaultValue={comment}
            disabled={this.disabledForm}
          />
        </div>
      </div>
    );
  }

  renderActionButtons() {
    const { selectedVersion, file } = this.state;

    return (
      <div className="vj-modal__footer">
        <Btn className="ecos-btn_grey ecos-btn_hover_grey vj-modal__btn-cancel" onClick={this.handleHideModal} disabled={this.disabledForm}>
          {t(Labels.CANCEL)}
        </Btn>
        <Btn
          className="ecos-btn_blue ecos-btn_hover_light-blue vj-modal__btn-add"
          onClick={this.handleSave}
          disabled={!this.isValidComment || !selectedVersion || !file || this.disabledForm}
        >
          {t(Labels.ADD)}
        </Btn>
      </div>
    );
  }

  renderErrorMessage() {
    const { errorMessage = '' } = this.props;
    const { clientError = '' } = this.state;

    if (!errorMessage && !clientError) {
      return null;
    }

    return <div className="vj-modal__error">{`${clientError} ${errorMessage}`}</div>;
  }

  render() {
    const { isShow, title, className, isLoadingModal } = this.props;

    return (
      <EcosModal
        isOpen={isShow}
        hideModal={this.handleHideModal}
        title={title}
        className={classNames('vj-modal', className)}
        reactstrapProps={{ backdrop: 'static', keyboard: true }}
      >
        {isLoadingModal && <Loader className="vj-modal__loader" blur />}
        {this.renderDropzone()}
        {this.renderErrorMessage()}
        {this.renderFile()}
        {this.renderVersions()}
        {this.renderComment()}
        {this.renderActionButtons()}
      </EcosModal>
    );
  }
}

export default AddModal;
