import React, { useContext } from 'react';
import classNames from 'classnames';
import InputView from '../InputView';
import SelectModal from '../SelectModal';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';

const SelectOrgstructRoot = () => {
  const context = useContext(SelectOrgstructContext);
  const { controlProps } = context;
  const { isCompact, viewOnly, className } = controlProps;

  const wrapperClasses = classNames('select-orgstruct', className, {
    'select-orgstruct_compact': isCompact,
    'select-orgstruct_view-only': viewOnly
  });

  return (
    <div className={wrapperClasses}>
      <InputView />
      {viewOnly ? null : <SelectModal />}
    </div>
  );
};

SelectOrgstructRoot.propTypes = {};

export default SelectOrgstructRoot;
