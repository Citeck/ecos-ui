import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import BaseReactComponent from '../base/BaseReactComponent';
import { t } from '../../../../helpers/export/util';
import ecosXhr from '../../../../helpers/ecosXhr';
import DialogManager from '../../../../components/common/dialogs/Manager';
import Button from './Button';

import '../../override/button/button.scss';

const Labels = {
  DEFAULT_CONFIRM_TITLE: 'ecos-form.import-button.confirm.default-title',
  DEFAULT_CONFIRM_DESCRIPTION: 'ecos-form.import-button.confirm.default-description',
  FAILED_UPLOADING_DESCRIPTION: 'ecos-form.import-button.failed-uploading.description',
  FAILED_UPLOADING_TITLE: 'ecos-form.import-button.failed-uploading.title',
  RESPONSE_HANDLER_ERROR: 'ecos-form.import-button.error.no-response-handler'
};

export default class ImportButtonComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'Import',
        key: 'importButton',
        type: 'importButton',
        theme: 'primary',
        size: 'sm',
        defaultValue: {},
        multipleFiles: false,
        confirmBeforeUpload: false,
        isShowUploadedFile: false
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Import Button',
      icon: 'fa fa-upload',
      group: 'advanced',
      weight: 0,
      schema: ImportButtonComponent.schema()
    };
  }

  #isOpenModal = false;

  get defaultSchema() {
    return ImportButtonComponent.schema();
  }

  get buttonClassName() {
    const { theme = 'default', size, block, customClass } = this.component;

    return classNames('btn', `btn-${theme}`, customClass, {
      [`btn-${size}`]: size,
      'btn-block': block
    });
  }

  getComponentToRender() {
    return Button;
  }

  getInitialReactProps() {
    return {
      className: this.buttonClassName,
      onSelect: this.handleSelect,
      toggleModal: this.handleToggleModal,
      isDisabled: this.disabled,
      label: this.labelIsHidden() ? '' : this.component.label,
      multiple: this.component.multipleFiles,
      isShowUploadedFile: this.component.isShowUploadedFile
    };
  }

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  createLabel() {}

  showConfirmModal() {
    DialogManager.confirmDialog({
      title: t(this.component.confirm.title || Labels.DEFAULT_CONFIRM_TITLE),
      text: t(this.component.confirm.description || Labels.DEFAULT_CONFIRM_DESCRIPTION),
      onYes: this.handleConfirmRemove
    });
  }

  handleConfirmRemove = () => {
    this.handleToggleModal(true);
  };

  handleSelect = (fileList, callback) => {
    Promise.allSettled(fileList.map(file => this.uploadFile(file, callback))).then(result => {
      const uploadedFilesInfo = (result || []).reduce((res, current) => {
        const fileName = get(current, 'value');

        if (!isEmpty(fileName)) {
          res.push(fileName);
        }

        return res;
      }, []);

      this.setReactProps({
        isLoading: false,
        uploadedFilesInfo
      });
      this.handleToggleModal();
    });
  };

  handleToggleModal = confirmed => {
    if (!this.#isOpenModal && this.component.confirmBeforeUpload && !confirmed) {
      this.showConfirmModal();
      return;
    }

    this.setReactProps({ isOpen: !this.#isOpenModal });
    this.#isOpenModal = !this.#isOpenModal;
  };

  uploadFile = async (file, handleProgress) => {
    const { uploadUrl, responseHandler } = this.component;

    if (!responseHandler) {
      return this.showErrorMessage(t(Labels.RESPONSE_HANDLER_ERROR));
    }

    this.setReactProps({
      isLoading: true
    });

    const formData = new FormData();

    formData.append(file.name, file);

    try {
      let result = await ecosXhr(uploadUrl, {
        method: 'POST',
        body: formData,
        handleProgress
      });

      if (result.json) {
        result = await result.json();
      }

      const handledResult = this.evaluate(responseHandler, { response: result, resp: result }, 'result', true);

      if (handledResult instanceof Error) {
        return this.showErrorMessage(handledResult.message);
      }

      this.updateValue({}, handledResult);

      return file.name;
    } catch (e) {
      console.error('Import error. Failure to upload file: ', e.message);
      this.showErrorMessage(t(Labels.FAILED_UPLOADING_TITLE));
    }
  };

  showErrorMessage = text => {
    DialogManager.showInfoDialog({
      title: t(Labels.FAILED_UPLOADING_DESCRIPTION),
      text
    });
  };
}
