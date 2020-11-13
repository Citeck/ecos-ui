import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../../../helpers/util';
import Select from '../../../../common/form/Select';
import { getPredicateInput } from '../../../../Records/predicates/predicates';

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
  applyFilters,
  item
}) => {
  const predicateInput = getPredicateInput(item, idx, null, selectedPredicate);
  const predicateProps = predicateInput.getProps({
    predicateValue,
    changePredicateValue,
    applyFilters
  });
  const FilterValueComponent = predicateInput.component;

  return (
    <li className="select-journal-filter">
      <div className="select-journal-filter__left" title={t(text)}>
        {t(text)}
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
            {selectedPredicate.needValue ? <FilterValueComponent {...predicateProps} /> : null}
          </div>
        </div>
        <span data-idx={idx} className={'icon icon-delete select-journal-filter__remove-btn'} onClick={onRemove} />
      </div>
    </li>
  );
};

Filter.propTypes = {
  text: PropTypes.string
};

export default Filter;
