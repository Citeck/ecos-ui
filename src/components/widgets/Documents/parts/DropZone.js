import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { default as DZ } from 'react-dropzone';
import get from 'lodash/get';

import { t } from '../../../../helpers/util';
import { FileStatuses } from '../../../../helpers/ecosXhr';

const Labels = {
  DROPZONE_PLACEHOLDER: 'dropzone.modal.dropzone_placeholder',
  DROPZONE_BUTTON_SELECT: 'dropzone.modal.dropzone_button_select',
  DROPZONE_BUTTON_CANCEL: 'dropzone.modal.dropzone_button_cancel',

  Messages: {
    ERROR_FILE_SIZE_MIN: 'versions-journal-widget.modal.error-file-size',
    ERROR_FILE_UPLOAD: 'versions-journal-widget.modal.error-file-upload',
    ERROR_FILE_ABORTED: 'versions-journal-widget.modal.error-file-aborted',
    ERROR_FILE_NOT_CHOSEN: 'versions-journal-widget.modal.error-file-not-chosen',
    ERROR_FILE_ONLY_ONE: 'versions-journal-widget.modal.error-file-only-one'
  }
};

class DropZone extends Component {
  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    withoutButton: PropTypes.bool,
    multiple: PropTypes.bool,
    isLoading: PropTypes.bool,
    immediateUploading: PropTypes.bool,
    style: PropTypes.object,
    onSelect: PropTypes.func,
    onUploaded: PropTypes.func
  };

  static defaultProps = {
    className: '',
    label: '',
    multiple: false,
    withoutButton: false,
    isLoading: false,
    immediateUploading: false,
    style: {},
    onSelect: () => {},
    onUploaded: () => {}
  };

  state = {
    xhr: null,
    file: null,
    filePercent: 0,
    clientError: '',
    canCancel: false
  };

  dropzoneRef = React.createRef();

  get label() {
    const { label } = this.props;

    if (label) {
      return label;
    }

    return t(Labels.DROPZONE_PLACEHOLDER);
  }

  handleChangeStatus = (state, xhr) => {
    const { clientError: _clientError } = this.state;
    const { status: fileStatus, percent: filePercent, response } = state;
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
        const { message, status } = response || {};
        const { description } = status || {};
        const clientError = `${t(Labels.Messages.ERROR_FILE_UPLOAD)}. ${message} ${description}`;

        if (_clientError !== clientError) {
          newState = {
            ...this.initStateFile,
            ...newState,
            clientError
          };
        }
        break;
      case FileStatuses.HEADERS_RECEIVED:
        if (filePercent === 100) {
          this.props.onUploaded();
        }
        newState = {
          ...newState,
          canCancel: false
        };
        break;
      default:
        break;
    }

    this.setState(newState);
  };

  handleDropFile = acceptedFiles => {
    const [file = null] = acceptedFiles;
    const clientError = this.validateUploadedFile(file);

    if (clientError) {
      this.setState({ file: null, clientError, canCancel: false });
    } else {
      this.setState({ file, clientError: '', canCancel: true });
      this.props.onSelect(acceptedFiles, this.handleChangeStatus);
    }
  };

  handleOpenFileDialog = () => {
    const ref = get(this.dropzoneRef, 'current', null);

    if (ref) {
      ref.open();
    }
  };

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

  renderSelectButton() {
    const { withoutButton } = this.props;

    if (withoutButton) {
      return null;
    }

    return (
      <div className="ecos-dropzone__label-part ecos-dropzone__button" onClick={this.handleOpenFileDialog}>
        {t(Labels.DROPZONE_BUTTON_SELECT)}
      </div>
    );
  }

  renderDropzoneInputContent() {
    return (
      <div className="ecos-dropzone__label">
        <div className="ecos-dropzone__label-part">{this.label}</div>
        {this.renderSelectButton()}
      </div>
    );
  }

  renderProgressBar() {
    const { filePercent, canCancel, xhr } = this.state;
    const cancelUpload = () => {
      xhr && xhr.abort();
    };

    return (
      <div className="ecos-dropzone__uploading">
        {(filePercent < 100 || canCancel) && <progress max="100" value={filePercent} className="ecos-dropzone__progress-bar" />}
        {canCancel && (
          <div className="ecos-dropzone__button" onClick={cancelUpload}>
            {t(Labels.DROPZONE_BUTTON_CANCEL)}
          </div>
        )}
      </div>
    );
  }

  render() {
    const { multiple, isLoading, className, onDropRejected, style } = this.props;

    return (
      <DZ
        ref={this.dropzoneRef}
        multiple={multiple}
        onDrop={this.handleDropFile}
        onDropRejected={onDropRejected}
        noClick
        noKeyboard
        disabled={isLoading}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            className={classNames('ecos-dropzone', className, {
              'ecos-dropzone_active': isDragActive,
              'ecos-dropzone_loading': isLoading
            })}
            {...getRootProps()}
            style={style}
            onClick={event => event.preventDefault()}
          >
            <input {...getInputProps()} />
            {!isLoading && this.renderDropzoneInputContent()}
            {isLoading && this.renderProgressBar()}
          </div>
        )}
      </DZ>
    );
  }
}

export default DropZone;
