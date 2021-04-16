import classNames from 'classnames';

import BaseReactComponent from '../base/BaseReactComponent';
import { t } from '../../../../helpers/export/util';
import ecosFetch from '../../../../helpers/ecosFetch';
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
        multipleFiles: false
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

  get defaultSchema() {
    return ImportButtonComponent.schema();
  }

  // build() {
  //   super.build();
  //
  //   this.addEventListener(this.buttonElement, 'click', this.handleClick);
  // }

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
      onChange: this.handleChange,
      isDisabled: this.disabled,
      label: this.labelIsHidden() ? '' : this.component.label,
      multiple: this.component.multipleFiles
    };
  }

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  createLabel() {}

  handleChange = fileList => {
    console.warn({ fileList, self: this });

    for (let i = 0; i < fileList.length; i++) {
      this.uploadFile(fileList.item(i));
    }
  };

  uploadFile = async file => {
    const { uploadUrl, responseHandler } = this.component;

    if (!responseHandler) {
      return this.showErrorMessage(t('ecos-table-form.error.no-response-handler'));
    }

    const formData = new FormData();

    formData.append(file.name, file);

    try {
      const response = await ecosFetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      const handledResult = this.evaluate(responseHandler, { response: result, resp: result }, 'result', true);

      if (handledResult instanceof Error) {
        return this.showErrorMessage(handledResult.message);
      }

      const currentValue = this.getValue();
      let newValue;

      if (Array.isArray(handledResult)) {
        newValue = currentValue.concat(handledResult);
      } else {
        newValue = [...currentValue, handledResult];
      }

      this.updateValue({}, newValue);
    } catch (e) {
      console.error('TableForm error. Failure to upload file: ', e.message);
      this.showErrorMessage(t('ecos-table-form.error.failure-to-import'));
    }
  };

  showErrorMessage = text => {
    DialogManager.showInfoDialog({
      title: t('ecos-table-form.error-dialog.title'),
      text
    });
  };
}
