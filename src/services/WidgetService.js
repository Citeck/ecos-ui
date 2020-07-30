import ReactDOM from 'react-dom';
import React from 'react';

import { t } from '../helpers/util';
import Modal from '../components/common/EcosModal/CiteckEcosModal';
import { UploadNewVersion } from '../components/formAction';
import { DocPreview } from '../components/widgets/DocPreview';
import { SelectOrgstruct } from '../components/common/form';
import BusinessProcessViewer from '../components/BusinessProcessViewer';

export default class WidgetService {
  static uploadNewVersion(params = {}) {
    const { record, onClose } = params;
    const container = document.createElement('div');

    const onCloseModal = done => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      onClose && onClose(done);
    };

    ReactDOM.render(<UploadNewVersion record={record} onClose={onCloseModal} />, container);
    document.body.appendChild(container);
  }

  static openPreviewModal(params = {}) {
    const { recordId, title = 'doc-preview.modal.title' } = params;
    const modal = new Modal();

    modal.open(<DocPreview height={'100%'} scale={1} recordId={recordId} className="ecos-modal-preview-doc__content" />, {
      title: t(title),
      class: 'ecos-modal-preview-doc'
    });
  }

  static openSelectOrgstructModal(params = {}) {
    const { defaultValue, onSelect } = params;
    const container = document.createElement('div');
    let timer;

    const handleClose = () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      clearTimeout(timer);
    };

    const handleCancel = () => {
      timer = setTimeout(handleClose, 100);
    };

    const handleSelect = values => {
      onSelect && onSelect(values);
      timer = setTimeout(handleClose, 100);
    };

    ReactDOM.render(
      <SelectOrgstruct
        openByDefault
        hideInputView
        defaultValue={defaultValue}
        onChange={handleSelect}
        onCancelSelect={handleCancel}
        className="select-orgstruct-modal"
        modalTitle={t('select-orgstruct.modal.title.edit-task-assignee')}
      />,
      container
    );
    document.body.appendChild(container);
  }

  static openBusinessProcessModal(params = {}) {
    const { name, version, onClose, ...props } = params;
    const modal = new Modal();

    modal.open(<BusinessProcessViewer {...props} />, {
      title: [name, version].filter(val => !!val).join(' / '),
      class: 'ecos-modal-business-process',
      onHideModal: onClose
    });
  }
}
