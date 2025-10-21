import classNames from 'classnames';
import React, { useContext } from 'react';

import Loader from '../../../../Loader/Loader';
import Orgstruct from '../../../../Orgstruct';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import InputView from '../InputView';
// import SelectModal from '../SelectModal';

const SelectOrgstructRoot = () => {
  const context = useContext(SelectOrgstructContext);
  const { controlProps, selectedRows, setSelectedRows, isSelectModalOpen, toggleSelectModal, onChangeValue, ...orgstructProps } = context;
  const { isCompact, viewOnly, className, isLoading, isSkipSearchInWorkspace } = controlProps;

  const wrapperClasses = classNames('select-orgstruct', className, {
    'select-orgstruct_compact': isCompact,
    'select-orgstruct_view-only': viewOnly
  });

  return (
    <div className={wrapperClasses}>
      {isLoading && <Loader blur />}
      <InputView />
      {!viewOnly && isSelectModalOpen && (
        <Orgstruct
          onSubmit={newSelectedRows => {
            onChangeValue(newSelectedRows);
            setSelectedRows(newSelectedRows);
            toggleSelectModal(false);
          }}
          onCancelSelect={() => {
            toggleSelectModal(false);
          }}
          initSelectedRows={selectedRows}
          openByDefault
          isSkipSearchInWorkspace={isSkipSearchInWorkspace}
          {...orgstructProps}
        />
      )}
    </div>
  );
};

SelectOrgstructRoot.propTypes = {};

export default SelectOrgstructRoot;
