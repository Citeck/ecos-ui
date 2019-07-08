import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone-uploader';

import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';

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

  getUploadParams = ({ meta }) => {
    return { url: 'https://httpbin.org/post' };
  };

  handleChangeStatus = ({ meta, file }, status) => {
    console.log(status, meta, file);
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
            dropzone: 'vj-modal__dropzone',
            inputLabel: 'vj-modal__input-label'
          }}
          SubmitButtonComponent={null}
        />
      </EcosModal>
    );
  }
}

export default AddModal;
