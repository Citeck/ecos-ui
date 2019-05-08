import React, { useContext, Fragment } from 'react';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { t } from '../../../../../../helpers/util';
import './ViewMode.scss';

const ViewMode = () => {
  const context = useContext(SelectOrgstructContext);

  const { placeholder } = context.controlProps;
  const { selectedRows } = context;

  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  return (
    <Fragment>
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
    </Fragment>
  );
};

ViewMode.propTypes = {};

export default ViewMode;
