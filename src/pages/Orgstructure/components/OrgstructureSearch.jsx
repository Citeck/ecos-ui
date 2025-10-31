import React, { useContext, useRef } from 'react';
import classNames from 'classnames';

import { Input } from '../../../components/common/form';
import { OrgstructContext } from '../../../components/common/Orgstruct/OrgstructContext';
import { t } from '../../../helpers/util';

import './style.scss';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.search.placeholder'
};

const OrgstructureSearch = () => {
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
