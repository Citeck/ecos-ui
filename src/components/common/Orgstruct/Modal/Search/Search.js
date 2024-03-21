import React, { useContext, useRef } from 'react';
import classNames from 'classnames';

import Input from '../../../form/Input';
import { OrgstructContext } from '../../OrgstructContext';
import { t } from '../../../../../helpers/util';
import Icon from '../../../icons/Icon';
import { Btn } from '../../../btns';

import './Search.scss';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.search.placeholder'
};

const Search = () => {
  const context = useContext(OrgstructContext);
  const { searchText, updateSearchText, onUpdateTree, resetSearchText } = context;
  const inputRef = useRef(null);

  const onSearchIconClick = () => {
    inputRef.current.focus();
  };

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      onUpdateTree();
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
      <Btn onClick={onUpdateTree} className="ecos-btn_blue">
        {t(Labels.PLACEHOLDER)}
      </Btn>
    </div>
  );
};

export default Search;
