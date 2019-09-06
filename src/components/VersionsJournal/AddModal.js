import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone-uploader';
import classNames from 'classnames';
import get from 'lodash/get';

import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';
import Radio from '../common/form/Radio';
import Btn from '../common/btns/Btn/Btn';
import { FILE_STATUS, VERSIONS } from '../../constants/versionsJournal';

import 'react-dropzone-uploader/dist/styles.css';

const LABELS = {
  DROPZONE_PLACEHOLDER: 'versions-journal-widget.modal.dropzone_placeholder',
  DROPZONE_SELECT_BUTTON: 'versions-journal-widget.modal.dropzone_select_button',

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
    ERROR_FILE_SIZE_MIN: 'versions-journal-widget.modal.error-file-size'
  }
};

class AddModal extends Component {
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
    file: null,
    fileStatus: '',
    selectedVersion: VERSIONS.MINOR,
    comment: '',
    isMajorVersion: false,
    clientError: ''
  };

  get dropzoneClassName() {
    const { fileStatus } = this.state;
    const classes = ['vj-modal__dropzone'];

    if (
      [FILE_STATUS.PREPARING, FILE_STATUS.UPLOADING, FILE_STATUS.GETTING_UPLOAD_PARAMS, FILE_STATUS.HEADERS_RECEIVED].includes(fileStatus)
    ) {
      classes.push('vj-modal__dropzone_uploading');
    }

    return classes.join(' ');
  }

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

  validateUploadedFile = file => {
    let clientError = [];

    if (!file.size) {
      const arrMsg = t(LABELS.Messages.ERROR_FILE_SIZE_MIN).split('VAL');
      const vals = [file.name, file.size];
      const msg = arrMsg.map((item, i) => item + get(vals, i.toString(), ''));

      clientError.push(msg.join(''));
    }

    return clientError.join(' ');
  };

  getUploadParams = ({ file }) => {
    const body = new FormData();
    const clientError = this.state.clientError || this.validateUploadedFile(file);

    if (clientError) {
      this.setState({ file: null, clientError });
    } else {
      this.setState({ file, clientError: '' });
    }

    return {
      url: 'https://httpbin.org/post',
      body
    };
  };

  handleChangeStatus = ({ meta, file, remove, xhr }, status) => {
    this.setState({ fileStatus: status });

    switch (status) {
      case FILE_STATUS.PREPARING:
        const clientError = this.validateUploadedFile(file);

        if (clientError) {
          this.setState({ file: null, clientError });
          remove();
        } else {
          this.setState({ clientError: '' });
        }
        break;
      case FILE_STATUS.DONE:
        remove();
        break;
      default:
        break;
    }
  };

  handleSubmit = (files, allFiles) => {
    allFiles.forEach(f => f.remove());
  };

  handleHideModal = () => {
    this.props.onHideModal();
    this.setState({
      file: null,
      fileStatus: '',
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
      isMajor: selectedVersion === VERSIONS.MAJOR
    });
  };

  renderDropzoneInputContent = () => [
    <label className="vj-modal__input-label-in" key={LABELS.DROPZONE_PLACEHOLDER}>
      {t(LABELS.DROPZONE_PLACEHOLDER)}
    </label>,
    <div className="vj-modal__input-button" key={LABELS.DROPZONE_SELECT_BUTTON}>
      {t(LABELS.DROPZONE_SELECT_BUTTON)}
    </div>
  ];

  renderDropzoneSubmitButton = props => (
    <div
      className="vj-modal__input-button"
      onClick={() => {
        props.files[0].cancel();
        props.files[0].remove();
        this.setState({ file: null, clientError: '' });
      }}
    >
      {t(LABELS.CANCEL)}
    </div>
  );

  renderDropzone() {
    return (
      <Dropzone
        multiple={false}
        canCancel={false}
        canRemove={false}
        canRestart={false}
        maxFiles={1}
        getUploadParams={this.getUploadParams}
        onChangeStatus={this.handleChangeStatus}
        onSubmit={this.handleSubmit}
        inputContent={this.renderDropzoneInputContent}
        SubmitButtonComponent={this.renderDropzoneSubmitButton}
        classNames={{
          dropzone: this.dropzoneClassName,
          inputLabel: 'vj-modal__input-label'
        }}
      />
    );
  }

  renderVersions() {
    const { currentVersion } = this.props;
    const { selectedVersion } = this.state;

    return (
      <div className="vj-modal__radio">
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
    const { selectedVersion, file } = this.state;

    return (
      <div className="vj-modal__footer">
        <Btn className="ecos-btn_grey ecos-btn_hover_grey vj-modal__btn-cancel" onClick={this.handleHideModal}>
          {t(LABELS.CANCEL)}
        </Btn>
        <Btn
          className="ecos-btn_blue ecos-btn_hover_light-blue vj-modal__btn-add"
          onClick={this.handleSave}
          disabled={!this.isValidComment || !selectedVersion || !file}
        >
          {t(LABELS.ADD)}
        </Btn>
      </div>
    );
  }

  renderErrorMessage() {
    const { errorMessage } = this.props;
    const { clientError } = this.state;

    if (!errorMessage && !clientError) {
      return null;
    }

    return <div className="vj-modal__error">{errorMessage || clientError}</div>;
  }

  render() {
    const { isShow, isLoading, title } = this.props;

    return (
      <EcosModal isOpen={isShow} isLoading={isLoading} hideModal={this.handleHideModal} title={title} className="vj-modal">
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
