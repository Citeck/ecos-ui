import React, { useContext } from 'react';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { t } from '../../../../../../helpers/util';
import './ViewMode.scss';

const ViewMode = () => {
  const context = useContext(SelectOrgstructContext);

  const { placeholder, isSelectedValueAsText } = context.controlProps;
  const { selectedRows } = context;

  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  return (
    <>
      {selectedRows.length > 0 ? (
        <ul className="select-orgstruct-view-mode__list">
          {selectedRows.map(item => (
            <li key={item.id}>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>{placeholderText}</p>
      )}
    </>
  );
};

ViewMode.propTypes = {};

export default ViewMode;
