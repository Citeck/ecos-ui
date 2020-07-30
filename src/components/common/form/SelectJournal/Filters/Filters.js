import React, { Component } from 'react';
import { Col, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import Dropdown from '../../../../common/form/Dropdown';
import { Btn, IcoBtn } from '../../../../common/btns';
import FiltersContext from './FiltersContext';
import Filter from '../Filter';
import { t } from '../../../../../helpers/util';
import './Filters.scss';

class Filters extends Component {
  onApply = () => {
    const { fields } = this.context;
    const { onApply } = this.props;

    onApply(
      fields.map(item => {
        const predicate = {
          t: item.selectedPredicate.value,
          att: item.attribute
        };

        if (item.selectedPredicate.needValue) {
          predicate.val = item.predicateValue;
        }

        return predicate;
      })
    );
  };

  render() {
    const { fields, changePredicate, changePredicateValue, addField, removeField } = this.context;
    const { columns } = this.props;

    return (
      <div className="select-journal-filters">
        <div className="select-journal-filters__list-wrapper">
          <ul className="select-journal-filters__list">
            {fields.map((item, idx) => {
              const onChangePredicate = value => {
                changePredicate(idx, value);
              };

              const onChangePredicateValue = value => {
                changePredicateValue(idx, value);
              };

              return (
                <Filter
                  key={`${item.attribute}_${idx}`}
                  text={item.text}
                  idx={idx}
                  data-idx={idx}
                  predicates={item.predicates}
                  selectedPredicate={item.selectedPredicate}
                  onRemove={removeField}
                  changePredicate={onChangePredicate}
                  predicateValue={item.predicateValue}
                  applyFilters={this.onApply}
                  input={item.input}
                  changePredicateValue={onChangePredicateValue}
                />
              );
            })}
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
