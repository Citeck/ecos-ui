import React, { createRef } from 'react';
import { Icon } from '../../../components/common';
import { Input } from '../../../components/common/form';
import { t } from '../../../helpers/util';

import './style.scss';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.search.placeholder'
};

class Structure extends React.Component {
  constructor(props) {
    super(props);
    this.state = { searchValue: '' };
  }

  //   onSearchIconClick() {
  //     this.inputRef.current.focus();
  //   }

  handleSearch(value) {
    this.setState({ searchValue: value });
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      // onSubmitSearchForm();
    }
  }

  render() {
    const { searchValue } = this.state;
    return (
      <React.Fragment>
        <div className="orgstructure-page__structure__header">Оргструктура</div>
        <div className="orgstructure-page__search__container">
          {/* <Icon className="icon icon-search select-orgstruct__search-icon" onClick={this.onSearchIconClick} /> */}
          <Input
            // getInputRef={el => (this.inputRef.current = el.current)}
            placeholder={t(Labels.PLACEHOLDER)}
            onKeyDown={this.onKeyDown}
            className="select-orgstruct__search-input"
            value={searchValue}
            onChange={this.handleSearch}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default Structure;
