import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone-uploader';
import classNames from 'classnames';

import EcosModal from '../common/EcosModal';
import { t, deepClone } from '../../helpers/util';
import Radio from '../common/form/Radio';
import Btn from '../common/btns/Btn/Btn';

import 'react-dropzone-uploader/dist/styles.css';

const FILE_STATUS = {
  REJECT_FILE_TYPE: 'rejected_file_type',
  REJECT_MAX_FILES: 'rejected_max_files',
  PREPARING: 'preparing',
  ERROR_FILE_SIZE: 'error_file_size',
  ERROR_VALIDATION: 'error_validation',
  READY: 'ready',
  STARTED: 'started',
  GETTING_UPLOAD_PARAMS: 'getting_upload_params',
  ERROR_UPLOAD_PARAMS: 'error_upload_params',
  UPLOADING: 'uploading',
  EXCEPTION_UPLOAD: 'exception_upload',
  ABORTED: 'aborted',
  RESTARTED: 'restarted',
  REMOVED: 'removed',
  ERROR_UPLOAD: 'error_upload',
  HEADERS_RECEIVED: 'headers_received',
  DONE: 'done'
};
const VERSIONS = {
  MINOR: 'minor',
  MAJOR: 'major'
};
const LABELS = {
  DROPZONE_PLACEHOLDER: 'Перетяните сюда файл или выберете вручную',
  DROPZONE_SELECT_BUTTON: 'Выбрать файл',

  CANCEL: 'Отмена',
  ADD: 'Добавить',

  VERSION_MINOR: 'Незначительные изменения',
  VERSION_MAJOR: 'Существенные изменения',

  COMMENT_TITLE: 'Комментарий',
  COMMENT_PLACEHOLDER: ['Не обязательно', 'не более', 'символов']
};

class AddModal extends Component {
  static propTypes = {
    isShow: PropTypes.bool,
    onHideModal: PropTypes.func,
    title: PropTypes.string,
    currentVersion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    commentMaxLength: PropTypes.number,
    errorMessage: PropTypes.string
  };

  static defaultProps = {
    isShow: false,
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
    comment: ''
  };

  getUploadParams = ({ file }) => {
    const body = new FormData();

    body.append('fileField', file);

    return {
      url: 'https://httpbin.org/post',
      // url: '/share/proxy/alfresco/api/upload',
      body
    };
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

  getVersion(number, isMajor = false) {
    const version = Number(number);
    let result = 1;

    if (isMajor) {
      result = Math.ceil(version);
    } else {
      let [major, minor] = version.toString().split('.');

      result = Number(`${major}.${+minor + 1}`);
    }

    return Number.isInteger(result) ? `${result}.0` : result;
  }

  handleChangeStatus = ({ meta, file, remove, xhr }, status) => {
    this.setState({ fileStatus: status });

    console.warn(status);

    if (status === FILE_STATUS.DONE) {
      this.setState({ file });
      remove();
    }
  };

  handleSubmit = (files, allFiles) => {
    console.log(files.map(f => f.meta));
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

  handleChangeComment = comment => {
    this.setState({ comment });
  };

  handleSave = () => {};

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
        inputContent={() => (
          <React.Fragment>
            <label className="vj-modal__input-label-in">{t(LABELS.DROPZONE_PLACEHOLDER)}</label>
            <div className="vj-modal__input-button">{t(LABELS.DROPZONE_SELECT_BUTTON)}</div>
          </React.Fragment>
        )}
        classNames={{
          dropzone: this.dropzoneClassName,
          inputLabel: 'vj-modal__input-label'
        }}
        SubmitButtonComponent={props => {
          return (
            <div
              className="vj-modal__input-button"
              onClick={() => {
                props.files[0].cancel();
                props.files[0].remove();
              }}
            >
              {t(LABELS.CANCEL)}
            </div>
          );
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
            placeholder={`${LABELS.COMMENT_PLACEHOLDER[0]} (${LABELS.COMMENT_PLACEHOLDER[1]} ${commentMaxLength} ${
              LABELS.COMMENT_PLACEHOLDER[2]
            })`}
            className="vj-modal__comment-input"
            onChange={this.handleChangeComment}
          >
            {comment}
          </textarea>
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

    if (!errorMessage) {
      return null;
    }

    return <div className="vj-modal__error">{errorMessage}</div>;
  }

  render() {
    const { isShow, title } = this.props;

    return (
      <EcosModal isOpen={isShow} hideModal={this.handleHideModal} title={title} className="vj-modal">
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
