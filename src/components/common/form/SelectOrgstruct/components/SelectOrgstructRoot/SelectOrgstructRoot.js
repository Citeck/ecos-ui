import React, { useContext } from 'react';
import classNames from 'classnames';
import InputView from '../InputView';
import SelectModal from '../SelectModal';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';

const SelectOrgstructRoot = () => {
  const context = useContext(SelectOrgstructContext);
  const { controlProps } = context;
  const { isCompact } = controlProps;

  const wrapperClasses = classNames('select-orgstruct', {
    'select-orgstruct_compact': isCompact
  });

  return (
    <div className={wrapperClasses}>
      <InputView />
      <SelectModal />
    </div>
  );
};

SelectOrgstructRoot.propTypes = {};

export default SelectOrgstructRoot;
