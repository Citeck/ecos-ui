import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone-uploader';

import EcosModal from '../common/EcosModal';
import { t, deepClone } from '../../helpers/util';

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

class AddModal extends Component {
  static propTypes = {
    isShow: PropTypes.bool,
    onHideModal: PropTypes.func,
    title: PropTypes.string
  };

  static defaultProps = {
    isShow: false,
    onHideModal: () => {},
    title: ''
  };

  state = {
    file: null,
    fileStatus: ''
  };

  getUploadParams = ({ meta }) => {
    return { url: 'https://httpbin.org/post' };
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

  handleChangeStatus = ({ meta, file, remove }, status) => {
    this.setState({ fileStatus: status });

    if (status === FILE_STATUS.DONE) {
      this.setState({ file });
      remove();
    }
  };

  handleSubmit = (files, allFiles) => {
    console.log(files.map(f => f.meta));
    allFiles.forEach(f => f.remove());
  };

  render() {
    const { isShow, onHideModal, title } = this.props;

    return (
      <EcosModal isOpen={isShow} hideModal={onHideModal} title={title} className="vj-modal">
        <Dropzone
          multiple={false}
          canCancel={false}
          canRemove={false}
          maxFiles={1}
          getUploadParams={this.getUploadParams}
          onChangeStatus={this.handleChangeStatus}
          onSubmit={this.handleSubmit}
          inputContent={() => (
            <React.Fragment>
              <label className="vj-modal__input-label-in">{t('Перетяните сюда файл или выберете вручную')}</label>
              <div className="vj-modal__input-button">{t('Выбрать файл')}</div>
            </React.Fragment>
          )}
          classNames={{
            dropzone: this.dropzoneClassName,
            inputLabel: 'vj-modal__input-label'
          }}
          SubmitButtonComponent={props => {
            // console.warn(props);
            return (
              <div
                className="vj-modal__input-button"
                onClick={() => {
                  props.files[0].cancel();
                  props.files[0].remove();
                }}
              >
                {t('Отмена')}
              </div>
            );
          }}
          // SubmitButtonComponent={null}
        />
      </EcosModal>
    );
  }
}

export default AddModal;
