import React, { useContext, useRef } from 'react';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';
import { Btn } from '../../../../../common/btns';
import { TableFormContext } from '../../TableFormContext';
import { t } from '../../../../../../helpers/util';

const ImportButton = () => {
  const context = useContext(TableFormContext);
  const fileRef = useRef();

  const { gridRows } = context;
  const { disabled, multiple, viewOnly, displayElements, importButton } = context.controlProps;

  if (!importButton.enable) {
    return null;
  }

  const shouldShowCreateButton = isBoolean(get(displayElements, 'create')) ? displayElements.create : true;

  if (viewOnly || !shouldShowCreateButton) {
    return null;
  }

  const buttonClasses = classNames('ecos-btn_blue', {
    'ecos-btn_narrow': true
  });

  let isButtonDisabled = disabled;
  if (!multiple && gridRows.length > 0) {
    isButtonDisabled = true;
  }

  const onClick = () => {
    fileRef.current.value = '';
    fileRef.current.click();
  };
  const onChange = () => {
    const files = fileRef.current.files;
    if (typeof importButton.onChange === 'function') {
      importButton.onChange(files);
    }
  };

  return (
    <>
      <input type="file" tabIndex="-1" onChange={onChange} ref={fileRef} className="ecos-table-form__import-input" multiple />
      <Btn className={buttonClasses} onClick={onClick} disabled={isButtonDisabled}>
        {t('ecos-table-form.import-button')}
      </Btn>
    </>
  );
};

ImportButton.propTypes = {};

export default ImportButton;
