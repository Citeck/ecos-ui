import React, { useContext } from 'react';
import classNames from 'classnames';
import InputView from '../InputView';
// import SelectModal from '../SelectModal';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import Orgstruct from '../../../../Orgstruct';
import Loader from '../../../../Loader/Loader';

const SelectOrgstructRoot = () => {
  const context = useContext(SelectOrgstructContext);
  const {
    controlProps,
    selectedRows,
    setSelectedRows,
    isSelectModalOpen,
    toggleSelectModal,
    onChangeValue,
    ...orgstructProps
  } = context;
  const { isCompact, viewOnly, className, isLoading } = controlProps;

  const wrapperClasses = classNames('select-orgstruct', className, {
    'select-orgstruct_compact': isCompact,
    'select-orgstruct_view-only': viewOnly
  });

  return (
    <div className={wrapperClasses}>
      {isLoading && <Loader blur />}
      <InputView />
      {!viewOnly && isSelectModalOpen && <Orgstruct
          onSubmit={(newSelectedRows) => {
            onChangeValue(newSelectedRows);
            setSelectedRows(newSelectedRows);
            toggleSelectModal(false);
          }}
          onCancelSelect={() => {
            toggleSelectModal(false);
          }}
          initSelectedRows={selectedRows}
          openByDefault
          {...orgstructProps}
        />}
    </div>
  );
};

SelectOrgstructRoot.propTypes = {};

export default SelectOrgstructRoot;
