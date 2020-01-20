import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { default as DZ } from 'react-dropzone';
import get from 'lodash/get';

import { t } from '../../../helpers/util';

const Labels = {
  DROPZONE_PLACEHOLDER: 'versions-journal-widget.modal.dropzone_placeholder',
  DROPZONE_BUTTON_SELECT: 'versions-journal-widget.modal.dropzone_button_select',
  DROPZONE_BUTTON_CANCEL: 'versions-journal-widget.modal.dropzone_button_cancel',

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
    multiple: PropTypes.bool,
    isLoading: PropTypes.bool,
    immediateUploading: PropTypes.bool,
    onSelect: PropTypes.func
  };

  static defaultProps = {
    multiple: false,
    isLoading: false,
    immediateUploading: false,
    onSelect: () => {}
  };

  state = {
    xhr: null,
    file: null,
    filePercent: 0,
    clientError: ''
  };

  dropzoneRef = React.createRef();

  handleDropFile = acceptedFiles => {
    const [file = null] = acceptedFiles;
    const clientError = this.validateUploadedFile(file);

    console.warn(acceptedFiles);

    if (clientError) {
      this.setState({ file: null, clientError });
    } else {
      this.setState({ file, clientError: '' });

      this.props.onSelect(
        acceptedFiles.map(item => {
          const target = new FormData();

          target.append('data', item, item.name);
          target.append('name', item.name);
          target.append('size', item.size);

          console.warn('target => ', target.get('data'));
          console.warn('item => ', item);

          return target;
        })
      );
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

  renderDropzoneInputContent() {
    return (
      <div className="ecos-dropzone__label">
        <div className="ecos-dropzone__label-in">{t(Labels.DROPZONE_PLACEHOLDER)}</div>
        <div className="ecos-dropzone__button" onClick={this.handleOpenFileDialog}>
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
      <div className="ecos-dropzone__uploading">
        <progress max="100" value={filePercent} className="ecos-dropzone__progress-bar" />
        <div className="ecos-dropzone__button" onClick={cancelUpload}>
          {t(Labels.DROPZONE_BUTTON_CANCEL)}
        </div>
      </div>
    );
  }

  render() {
    const { multiple, isLoading } = this.props;

    return (
      <DZ ref={this.dropzoneRef} multiple={multiple} onDrop={this.handleDropFile} noClick noKeyboard disabled={isLoading}>
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            className={classNames('ecos-dropzone', {
              'ecos-dropzone_active': isDragActive,
              'ecos-dropzone_loading': isLoading
            })}
            {...getRootProps()}
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
