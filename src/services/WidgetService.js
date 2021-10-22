import ReactDOM from 'react-dom';
import React from 'react';

import { t } from '../helpers/util';
import { UploadNewVersion } from '../components/formAction';
import BusinessProcessViewer from '../components/BusinessProcessViewer';
import { DocPreview } from '../components/widgets/DocPreview';
import Modal from '../components/common/EcosModal/CiteckEcosModal';
import { SelectOrgstruct } from '../components/common/form';
import { AUTHORITY_TYPE_USER, TabTypes } from '../components/common/form/SelectOrgstruct/constants';
import { PasswordEditor } from '../components/Password';
import PresetEditor, { Labels as PresetLabels } from '../components/Journals/Presets/PresetEditor';

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
    const { recordId, title = 'doc-preview.modal.title', scale = 1 } = params;
    const modal = new Modal();

    modal.open(<DocPreview height={'100%'} scale={scale} recordId={recordId} className="ecos-modal-preview-doc__content" />, {
      title: t(title),
      class: 'ecos-modal-preview-doc',
      classBody: 'ecos-modal-preview-doc__body'
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
      onSelect && onSelect(false);
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
        allowedAuthorityTypes={[AUTHORITY_TYPE_USER]}
        defaultTab={TabTypes.USERS}
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

  static openEditorPassword(params = {}) {
    const container = document.createElement('div');
    const render = (props, callback) => ReactDOM.render(<PasswordEditor {...props} />, container, callback);

    const modal = render({ isLoading: true, isShow: true, ...params });
    document.body.appendChild(container);

    return {
      update: (newProps, callback) => render({ ...modal.props, ...newProps }, callback),
      terminate: () =>
        render({ isShow: false }, () => {
          ReactDOM.unmountComponentAtNode(container);
          document.body.removeChild(container);
        })
    };
  }

  static openEditorJournalPreset(params = {}) {
    const modal = new Modal();

    modal.open(
      <PresetEditor
        isAdmin={params.isAdmin}
        authorityRef={params.authorityRef}
        data={params.data || {}}
        onClose={params.onClose}
        onSave={params.onSave}
      />,
      { title: t(PresetLabels.TITLE_CREATE), size: 'md' }
    );

    return modal;
  }
}
