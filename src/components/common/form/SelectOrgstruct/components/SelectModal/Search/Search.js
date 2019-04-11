import React, { useContext, useRef } from 'react';
import Input from '../../../../Input/Input';
import { SelectOrgstructContext } from '../../../SelectOrgstructContext';
import { t } from '../../../../../../../helpers/util';
import './Search.scss';

const Search = () => {
  const context = useContext(SelectOrgstructContext);

  const { searchText, updateSearchText, onSubmitSearchForm } = context;

  const inputRef = useRef(null);

  const onSearchIconClick = () => {
    inputRef.current.focus();
  };

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      onSubmitSearchForm();
    }
  };

  return (
    <div className="select-orgstruct__search">
      <span className="icon icon-search select-orgstruct__search-icon" onClick={onSearchIconClick} />
      <Input
        getInputRef={el => (inputRef.current = el.current)}
        placeholder={t('select-orgstruct.search.placeholder')}
        onKeyDown={onKeyDown}
        className={'select-orgstruct__search-input'}
        value={searchText}
        onChange={updateSearchText}
      />
    </div>
  );
};

export default Search;
