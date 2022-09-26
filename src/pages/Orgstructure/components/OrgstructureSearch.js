import classNames from 'classnames';
import React, { useContext, useRef } from 'react';
import { Input } from '../../../components/common/form';
import { SelectOrgstructContext } from '../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import { t } from '../../../helpers/util';
import './style.scss';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.search.placeholder'
};

const OrgstructureSearch = () => {
  const context = useContext(SelectOrgstructContext);
  const { searchText, updateSearchText, onSubmitSearchForm, resetSearchText } = context;
  const inputRef = useRef(null);

  const onSearchIconClick = () => {
    inputRef.current.focus();
  };

  const onKeyDown = e => {
    console.log(e.key);
    if (e.key === 'Enter') {
      onSubmitSearchForm();
    }
  };

  return (
    <div className="orgstructure-page__search__container">
      <div className="select-journal__search">
        <span className="icon icon-search select-journal__search-icon" onClick={onSearchIconClick} />
        <Input
          getInputRef={el => (inputRef.current = el.current)}
          placeholder={t(Labels.PLACEHOLDER)}
          onKeyDown={onKeyDown}
          className="select-orgstruct__search-input"
          value={searchText}
          onChange={updateSearchText}
        />
        <span
          className={classNames('icon-small-close select-orgstruct__search-cleaner', {
            'select-orgstruct__search-cleaner_show': !!searchText
          })}
          onClick={resetSearchText}
        />
      </div>
    </div>
  );
};

export default OrgstructureSearch;
