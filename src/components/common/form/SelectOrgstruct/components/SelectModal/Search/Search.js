import React, { useContext, useRef } from 'react';
import Input from '../../../../Input/Input';
import { SelectOrgstructContext } from '../../../SelectOrgstructContext';
import { t } from '../../../../../../../helpers/util';
import './Search.scss';
import { Btn } from '../../../../../btns';
import classNames from 'classnames';
import { Icon } from '../../../../../index';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.search.placeholder'
};

const Search = () => {
  const context = useContext(SelectOrgstructContext);
  const { searchText, updateSearchText, onSubmitSearchForm, resetSearchText } = context;
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
      <div className="select-orgstruct__search-wrapper">
        <Icon className="icon icon-search select-orgstruct__search-icon" onClick={onSearchIconClick} />
        <Input
          getInputRef={el => (inputRef.current = el.current)}
          placeholder={t(Labels.PLACEHOLDER)}
          onKeyDown={onKeyDown}
          className="select-orgstruct__search-input"
          value={searchText}
          onChange={updateSearchText}
        />
        <Icon
          className={classNames('icon-small-close select-orgstruct__search-cleaner', {
            'select-orgstruct__search-cleaner_show': !!searchText
          })}
          onClick={resetSearchText}
        />
      </div>
      <Btn onClick={onSubmitSearchForm} className="ecos-btn_blue">
        {t(Labels.PLACEHOLDER)}
      </Btn>
    </div>
  );
};

export default Search;
