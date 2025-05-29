import React from 'react';
import { Col, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../../helpers/util';
import { Btn, IcoBtn } from '../../../../common/btns';
import Dropdown from '../../../../common/form/Dropdown';
import ParserPredicate from '../../../../Filters/predicates/ParserPredicate';
import { Labels } from '../constants';
import Filter from '../Filter';
import FiltersContext from './FiltersContext';

import { COLUMN_DATA_TYPE_BOOLEAN, PREDICATE_CONTAINS } from '@/components/Records/predicates/predicates';
import './Filters.scss';

class Filters extends React.Component {
  componentWillUnmount() {
    this.onKeydown.cancel();
  }

  onApply = () => {
    const { fields, searchText } = this.context;
    const { onApply } = this.props;

    if (isFunction(onApply)) {
      const systemPredicate = fields.find((item) => item.attribute === 'system');
      const fieldsPredicates = fields
        .filter((item) => item.type !== COLUMN_DATA_TYPE_BOOLEAN)
        .map(({ selectedPredicate, attribute, predicateValue }) => {
          const predicate = {
            t: PREDICATE_CONTAINS,
            att: attribute,
            val: predicateValue ? predicateValue : searchText,
          };
          return ParserPredicate.replacePredicateType(predicate);
        });

      const customPredicate = {
        t: 'eq',
        att: 'system',
        val: systemPredicate.predicateValue ? systemPredicate.predicateValue : false,
      };
      const predicates = [customPredicate, { t: 'or', val: fieldsPredicates }];
      onApply(predicates);
    }
  };

  onReset = () => {
    const { resetFields } = this.context;
    resetFields();
  };

  onKeydown = debounce((e) => {
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
                onChangePredicate={(value) => changePredicate(idx, value)}
                onChangePredicateValue={(value) => changePredicateValue(idx, value)}
              />
            ))}
          </ul>
        </div>

        <Row>
          <Col md={6} xs={12}>
            <Dropdown source={columns} valueField={'attribute'} titleField={'text'} isStatic onChange={addField}>
              <IcoBtn invert icon="icon-small-down" className="ecos-btn_drop-down">
                {t(Labels.FILTER_ADD_FIELD_BTN)}
              </IcoBtn>
            </Dropdown>
          </Col>
          <Col md={6} xs={12}>
            <div className="select-journal-filters__apply-button-wrapper">
              <Btn className="ecos-btn_x-step_10" onClick={this.onReset}>
                {t(Labels.FILTER_RESET_BTN)}
              </Btn>
              <Btn className="ecos-btn_blue" onClick={this.onApply}>
                {t(Labels.FILTER_APPLY_BTN)}
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
      text: PropTypes.string,
    }),
  ),
  onApply: PropTypes.func,
};

export default Filters;
