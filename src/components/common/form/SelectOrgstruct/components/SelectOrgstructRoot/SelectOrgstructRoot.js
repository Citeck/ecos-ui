import React, { useContext } from 'react';
import classNames from 'classnames';
import InputView from '../InputView';
import SelectModal, { SelectModalProvider } from '../SelectModal';
import { RootContext } from '../../RootContext';

const SelectOrgstructRoot = () => {
  const context = useContext(RootContext);
  const { orgStructApi, controlProps } = context;
  const { isCompact } = controlProps;

  const wrapperClasses = classNames('select-orgstruct', {
    'select-orgstruct_compact': isCompact
  });

  return (
    <div className={wrapperClasses}>
      <SelectModalProvider orgStructApi={orgStructApi}>
        <InputView />
        <SelectModal />
      </SelectModalProvider>
    </div>
  );
};

SelectOrgstructRoot.propTypes = {};

export default SelectOrgstructRoot;
