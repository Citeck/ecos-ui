import classNames from 'classnames';
import React, { useContext } from 'react';

import { TableFormContext } from '../../TableFormContext';
import InputView from '../InputView';
import ModalForm from '../ModalForm';

const TableFormRoot = () => {
  const context = useContext(TableFormContext);
  const { controlProps } = context;
  const { isCompact } = controlProps;

  return (
    <div
      className={classNames('ecos-table-form', {
        'ecos-table-form_compact': isCompact
      })}
    >
      <InputView />
      <ModalForm />
    </div>
  );
};

export default TableFormRoot;
