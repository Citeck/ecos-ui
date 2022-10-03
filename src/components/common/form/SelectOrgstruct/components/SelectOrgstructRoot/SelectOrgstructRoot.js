import React, { useContext } from 'react';
import classNames from 'classnames';
import InputView from '../InputView';
import SelectModal from '../SelectModal';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { Loader } from '../../../../index';

const SelectOrgstructRoot = () => {
  const context = useContext(SelectOrgstructContext);
  const { controlProps } = context;
  const { isCompact, viewOnly, className, isLoading } = controlProps;

  const wrapperClasses = classNames('select-orgstruct', className, {
    'select-orgstruct_compact': isCompact,
    'select-orgstruct_view-only': viewOnly
  });

  return (
    <div className={wrapperClasses}>
      {isLoading && <Loader blur />}
      <InputView />
      {viewOnly ? null : <SelectModal />}
    </div>
  );
};

SelectOrgstructRoot.propTypes = {};

export default SelectOrgstructRoot;
