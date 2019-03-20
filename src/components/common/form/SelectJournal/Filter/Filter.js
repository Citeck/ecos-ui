import React from 'react';
import PropTypes from 'prop-types';
import Select from '../../../../common/form/Select';
import './Filter.scss';

const Filter = ({
  idx,
  text,
  predicates,
  selectedPredicate,
  onRemove,
  changePredicate,
  predicateValue,
  changePredicateValue,
  input,
  applyFilters
}) => (
  <li className="select-journal-filter">
    <div className="select-journal-filter__left" title={text}>
      {text}
    </div>
    <div className="select-journal-filter__right">
      <div className="select-journal-filter__predicate">
        <Select
          className={'select_narrow select-journal-filter__predicate-select'}
          options={predicates}
          value={selectedPredicate}
          data-idx={idx}
          onChange={changePredicate}
        />
        <div className="select-journal-filter__predicate-control">
          {selectedPredicate.needValue && input ? (
            <input.component
              {...input.getProps({
                predicateValue,
                changePredicateValue,
                applyFilters
              })}
            />
          ) : null}
        </div>
      </div>
      <span data-idx={idx} className={'icon icon-delete select-journal-filter__remove-btn'} onClick={onRemove} />
    </div>
  </li>
);

Filter.propTypes = {
  text: PropTypes.string
};

export default Filter;
