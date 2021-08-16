import React from 'react';
import { Col, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../../helpers/util';
import { Btn, IcoBtn } from '../../../../common/btns';
import Dropdown from '../../../../common/form/Dropdown';
import ParserPredicate from '../../../../Filters/predicates/ParserPredicate';
import Filter from '../Filter';
import FiltersContext from './FiltersContext';

import './Filters.scss';

class Filters extends React.Component {
  componentWillUnmount() {
    this.onKeydown.cancel();
  }

  onApply = () => {
    const { fields } = this.context;
    const { onApply } = this.props;

    if (isFunction(onApply)) {
      onApply(
        fields.map(item => {
          const { selectedPredicate, attribute, predicateValue } = item;
          const predicate = {
            t: selectedPredicate.value,
            att: attribute
          };

          if (selectedPredicate.needValue) {
            predicate.val = predicateValue;
          }

          if (selectedPredicate.fixedValue) {
            predicate.val = selectedPredicate.fixedValue;
          }

          return ParserPredicate.replacePredicateType(predicate);
        })
      );
    }
  };

  onKeydown = debounce(e => {
    if (e.key !== 'Enter') {
      return;
    }

    this.onApply();
  }, 50);

  render() {
    const { fields, changePredicate, changePredicateValue, addField, removeField } = this.context;
    const { columns } = this.props;

    return (
      <div className="select-journal-filters" onKeyDown={this.onKeydown}>
        <div className="select-journal-filters__list-wrapper">
          <ul className="select-journal-filters__list">
            {fields.map((item, idx) => (
              <Filter
                key={`${item.attribute}_${item.type}_${item.schema}`}
                text={item.text}
                item={item}
                idx={idx}
                data-idx={idx}
                predicates={item.predicates}
                selectedPredicate={item.selectedPredicate}
                predicateValue={item.predicateValue}
                onRemove={removeField}
                onChangePredicate={value => changePredicate(idx, value)}
                onChangePredicateValue={value => changePredicateValue(idx, value)}
              />
            ))}
          </ul>
        </div>

        <Row>
          <Col md={6} xs={12}>
            <Dropdown source={columns} valueField={'attribute'} titleField={'text'} isStatic onChange={addField}>
              <IcoBtn invert icon="icon-small-down" className="ecos-btn_drop-down ecos-btn_r_8 ecos-btn_grey6">
                {t('select-journal.filters.add-criteria')}
              </IcoBtn>
            </Dropdown>
          </Col>
          <Col md={6} xs={12}>
            <div className="select-journal-filters__apply-button-wrapper">
              <Btn className={'ecos-btn_blue'} onClick={this.onApply}>
                {t('select-journal.filters.apply-criteria')}
              </Btn>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

Filters.contextType = FiltersContext;

Filters.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      attribute: PropTypes.string,
      text: PropTypes.string
    })
  ),
  onApply: PropTypes.func
};

export default Filters;
