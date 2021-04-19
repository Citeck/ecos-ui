import classNames from 'classnames';

import BaseReactComponent from '../base/BaseReactComponent';
import { t } from '../../../../helpers/export/util';
import ecosXhr from '../../../../helpers/ecosXhr';
import DialogManager from '../../../../components/common/dialogs/Manager';
import Button from './Button';

import '../../override/button/button.scss';

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
        confirmBeforeUpload: false
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
      multiple: this.component.multipleFiles
    };
  }

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  createLabel() {}

  showConfirmModal() {
    DialogManager.confirmDialog({
      title: t(this.component.confirm.title || 'Удаление старых записей'),
      text: t(
        this.component.confirm.description ||
          'Перед загрузкой строк из файла - шаблона, текущие строки будут удалены. Вы хотите продолжить действие?'
      ),
      onYes: this.handleConfirmRemove
    });
  }

  handleConfirmRemove = () => {
    this.handleToggleModal(true);
  };

  handleSelect = (fileList, callback) => {
    for (let i = 0; i < fileList.length; i++) {
      this.uploadFile(fileList[i], callback);
    }
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
      return this.showErrorMessage(t('ecos-table-form.error.no-response-handler'));
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
    } catch (e) {
      console.error('Import error. Failure to upload file: ', e.message);
      this.showErrorMessage(t('Не удалось загрузить файл'));
    } finally {
      this.setReactProps({ isLoading: false });
      this.handleToggleModal();
    }
  };

  showErrorMessage = text => {
    DialogManager.showInfoDialog({
      title: t('ecos-table-form.error-dialog.title'),
      text
    });
  };
}
