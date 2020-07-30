import React, { useContext, useRef } from 'react';
import Input from '../../../../Input/Input';
import { SelectOrgstructContext } from '../../../SelectOrgstructContext';
import { t } from '../../../../../../../helpers/util';
import './Search.scss';
import { Btn } from '../../../../../btns';
import classNames from 'classnames';
import { Icon } from '../../../../../index';

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

  const onClean = () => {
    updateSearchText({
      target: {
        value: ''
      }
    });
  };

  return (
    <div className="select-orgstruct__search">
      <div className="select-orgstruct__search-wrapper">
        <span className="icon icon-search select-orgstruct__search-icon" onClick={onSearchIconClick} />
        <Input
          getInputRef={el => (inputRef.current = el.current)}
          placeholder={t('select-orgstruct.search.placeholder')}
          onKeyDown={onKeyDown}
          className="select-orgstruct__search-input"
          value={searchText}
          onChange={updateSearchText}
        />
        <Icon
          className={classNames('icon-small-close select-orgstruct__search-cleaner', {
            'select-orgstruct__search-cleaner_show': !!searchText
          })}
          onClick={onClean}
        />
      </div>
      <Btn onClick={onSubmitSearchForm} className="ecos-btn_blue">
        {t('select-orgstruct.search.placeholder')}
      </Btn>
    </div>
  );
};

export default Search;
