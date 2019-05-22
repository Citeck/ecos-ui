import React, { useContext } from 'react';
import classNames from 'classnames';
import { TableFormContext } from '../../TableFormContext';

const TableFormRoot = () => {
  const context = useContext(TableFormContext);
  const { controlProps } = context;
  const { isCompact, viewOnly } = controlProps;

  if (viewOnly) {
    return null;
  }

  const wrapperClasses = classNames('ecos-table-form', {
    'ecos-table-form_compact': isCompact
  });

  return <div className={wrapperClasses}>TableForm component</div>;
};

TableFormRoot.propTypes = {};

export default TableFormRoot;
