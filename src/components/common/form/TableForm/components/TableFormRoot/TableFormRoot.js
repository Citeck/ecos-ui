import React, { useContext } from 'react';
import classNames from 'classnames';
import { TableFormContext } from '../../TableFormContext';
import InputView from '../InputView';
import ModalForm from '../ModalForm';

const TableFormRoot = () => {
  const context = useContext(TableFormContext);
  const { controlProps } = context;
  const { isCompact, viewOnly } = controlProps;

  const wrapperClasses = classNames('ecos-table-form', {
    'ecos-table-form_compact': isCompact
  });

  return (
    <div className={wrapperClasses}>
      <InputView />
      {!viewOnly ? <ModalForm /> : null}
    </div>
  );
};

TableFormRoot.propTypes = {};

export default TableFormRoot;
