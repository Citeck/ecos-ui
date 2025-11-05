import classNames from 'classnames';
import React, { useContext, useRef } from 'react';

import { OrgstructContext } from '@/components/common/Orgstruct/OrgstructContext';
import { Input } from '@/components/common/form';
import Icon from '@/components/common/icons/Icon';
import { t } from '@/helpers/util';

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
      <div className="select-orgstruct__search-wrapper noMoreSelect">
        <Icon className="icon icon-search select-orgstruct__search-icon" onClick={onSearchIconClick} />
        <Input
          getInputRef={el => (inputRef.current = el.current)}
          placeholder={t(Labels.PLACEHOLDER)}
          onKeyDown={onKeyDown}
          className="select-orgstruct__search-input"
          value={searchText}
          onChange={updateSearchText}
        >
          <span
            className={classNames('icon-small-close select-orgstruct__search-cleaner', {
              'select-orgstruct__search-cleaner_show': !!searchText
            })}
            onClick={resetSearchText}
          />
        </Input>
      </div>
    </div>
  );
};

export default OrgstructureSearch;
