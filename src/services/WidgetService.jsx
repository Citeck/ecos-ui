import get from 'lodash/get';
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import BusinessProcessViewer from '../components/BusinessProcessViewer';
import { isFlowableProcess } from '../components/BusinessProcessViewer/util';
import FormManager from '../components/EcosForm/FormManager';
import { JournalsPresetEditor } from '../components/Journals/JournalsPresets';
import { notifyFailure, notifySuccess } from '../components/Records/actions/util/actionUtils';
import Modal from '../components/common/EcosModal/CiteckEcosModal';
import DialogManager from '../components/common/dialogs/Manager/index';
import { SelectOrgstruct } from '../components/common/form';
import { AUTHORITY_TYPE_USER, TabTypes } from '../components/common/form/SelectOrgstruct/constants';
import { UploadNewVersion } from '../components/formAction';
import { DocPreview } from '../components/widgets/DocPreview';
import { t } from '../helpers/util';

import { Loader } from '@/components/common/index';
import { getStore } from '@/store';

export default class WidgetService {
  _root = null;

  static uploadNewVersion(params = {}) {
    const { record, onClose } = params;
    const container = document.createElement('div');

    const onCloseModal = done => {
      this._root?.unmount();
      document.body.removeChild(container);
      onClose && onClose(done);
    };

    if (this._root) {
      this._root.unmount();
    }

    this._root = createRoot(container);
    this._root.render(<UploadNewVersion record={record} onClose={onCloseModal} />);
    document.body.appendChild(container);
  }

  static openPreviewModal(params = {}) {
    const { recordId, title = 'doc-preview.modal.title', scale = 'auto' } = params;
    const modal = new Modal();

    modal.open(<DocPreview height={'100%'} scale={scale} recordId={recordId} className="ecos-modal-preview-doc__content" />, {
      title: t(title),
      class: 'ecos-modal-preview-doc',
      classBody: 'ecos-modal-preview-doc__body'
    });
  }

  static openEditJournalWidgets(props = {}) {
    const Settings = lazy(() => import('../components/Journals/JournalsPreviewWidgets/WidgetSettings'));
    const store = getStore();
    const modalRef = React.createRef();

    let { onSave = () => {}, onClose = () => {}, ...otherProps } = props;

    const dialog = DialogManager.showCustomDialog({
      isVisible: true,
      title: t('widgets-settings.modal.title'),
      className: 'ecos-dashboard-settings-modal-wrapper ecos-modal_width-lg',
      isTopDivider: true,
      isBigHeader: true,
      reactstrapProps: { ref: modalRef, backdrop: 'static' },
      onHide: () => dialog.setVisible(false),
      body: (
        <Provider store={store}>
          <Suspense fallback={<Loader type="points" />}>
            <Settings
              modalRef={modalRef}
              onSetDialogProps={props => dialog.updateProps(props)}
              getDialogTitle={() => get(dialog, 'props.dialogProps.title')}
              onSave={() => {
                dialog.setVisible(false);
                onSave();
              }}
              onClose={() => {
                dialog.setVisible(false);
                onClose();
              }}
              {...otherProps}
            />
          </Suspense>
        </Provider>
      )
    });
  }

  static openSelectOrgstructModal(params = {}) {
    const { defaultValue, onSelect, orgstructParams = {} } = params;
    const container = document.createElement('div');
    let timer;

    const handleClose = () => {
      this._root?.unmount();
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

    let userSearchExtraFieldsStr = orgstructParams.userSearchExtraFields || '';
    const userSearchExtraFields = userSearchExtraFieldsStr.length > 0 ? userSearchExtraFieldsStr.split(',').map(item => item.trim()) : [];

    if (this._root) {
      this._root.unmount();
    }

    this._root = createRoot(container);
    this._root.render(
      <SelectOrgstruct
        openByDefault
        hideInputView
        defaultValue={defaultValue}
        onChange={handleSelect}
        onCancelSelect={handleCancel}
        userSearchExtraFields={userSearchExtraFields}
        className="select-orgstruct-modal"
        modalTitle={t('select-orgstruct.modal.title.edit-task-assignee')}
        allowedAuthorityTypes={[AUTHORITY_TYPE_USER]}
        defaultTab={TabTypes.USERS}
      />
    );
    document.body.appendChild(container);
  }

  static openBusinessProcessModal(params = {}) {
    const { name, version, onClose, ...props } = params;
    const modal = new Modal();

    modal.open(<BusinessProcessViewer {...props} modal={modal} hideModal={onClose} />, {
      title: [name, version].filter(val => !!val).join(' / '),
      class: `ecos-modal-business-process ${isFlowableProcess(props.recordId) ? '' : 'ecos-modal_width-full'}`,
      onHideModal: onClose
    });
  }

  static openEditorPassword(params = {}) {
    const open = newProps => {
      FormManager.openFormModal({
        record: newProps.recordRef,
        formKey: 'change-password-form',
        saveOnSubmit: true,
        onSubmit: rec => {
          rec
            .load('newPassword')
            .then(() => {
              notifySuccess(t('password-editor.success.change-profile-password'));
            })
            .catch(e => {
              notifyFailure(`${t('password-editor.error.change-profile-password')}. ${e.message}`);
            });
        }
      });
    };

    return {
      open
    };
  }

  static openEditorJournalPreset(params = {}) {
    const modal = new Modal();

    modal.open(
      <JournalsPresetEditor
        isAdmin={params.isAdmin}
        authoritiesRef={params.authoritiesRef}
        workspacesRefs={params.workspacesRefs}
        data={params.data || {}}
        onClose={params.onClose}
        onSave={params.onSave}
      />,
      { title: t(params.title), size: 'md' }
    );

    return modal;
  }
}
