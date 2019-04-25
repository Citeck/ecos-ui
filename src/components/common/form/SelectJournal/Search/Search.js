import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Input from '../../Input/Input';
import FiltersContext from '../Filters/FiltersContext';
import { t } from '../../../../../helpers/util';
import { PREDICATE_CONTAINS, COLUMN_DATA_TYPE_TEXT, COLUMN_DATA_TYPE_MLTEXT } from '../predicates';
import './Search.scss';

class Search extends Component {
  onKeyDown = e => {
    if (e.key === 'Enter') {
      const { onApply, searchField } = this.props;
      const searchValue = e.target.value;

      let predicates = [];
      if (searchValue) {
        if (searchField) {
          predicates = [
            {
              att: searchField,
              t: PREDICATE_CONTAINS,
              val: e.target.value
            }
          ];
        } else {
          const { fields } = this.context;
          const fieldsPredicates = fields
            .filter(item => {
              return item.default && (item.type === COLUMN_DATA_TYPE_TEXT || item.type === COLUMN_DATA_TYPE_MLTEXT);
            })
            .map(item => {
              return {
                att: item.attribute,
                t: PREDICATE_CONTAINS,
                val: e.target.value
              };
            });
          if (fieldsPredicates.length > 0) {
            predicates = [
              {
                t: 'or',
                val: fieldsPredicates
              }
            ];
          }
        }
      }

      onApply(predicates);
    }
  };

  onSearchIconClick = () => {
    this.input.current.focus();
  };

  render() {
    const { searchText, updateSearchText } = this.context;

    return (
      <div className="select-journal__search">
        <span className="icon icon-search select-journal__search-icon" onClick={this.onSearchIconClick} />
        <Input
          getInputRef={el => (this.input = el)}
          placeholder={t('select-journal.search.placeholder')}
          onKeyDown={this.onKeyDown}
          className={'select-journal__search-input'}
          value={searchText}
          onChange={updateSearchText}
        />
      </div>
    );
  }
}

Search.contextType = FiltersContext;

Search.propTypes = {
  searchField: PropTypes.string,
  onApply: PropTypes.func
};

export default Search;
