import React from 'react';
import { Col, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import Button from '../../../../common/buttons/Button/Button';
import Dropdown from '../../../../common/form/Dropdown';
import { IcoBtn } from '../../../../common/btns';
import FiltersContext from './FiltersContext';
import Filter from '../Filter';
import { t } from '../../../../../helpers/util';
import './Filters.scss';

const Filters = ({ columns, onApply }) => (
  <FiltersContext.Consumer>
    {context => (
      <div className="select-journal-filters">
        <div className="select-journal-filters__list-wrapper">
          <ul className="select-journal-filters__list">
            {context.fields.map((item, idx) => {
              const changePredicate = value => {
                context.changePredicate(idx, value);
              };

              const changePredicateValue = value => {
                context.changePredicateValue(idx, value);
              };

              return (
                <Filter
                  key={`${item.attribute}_${idx}`}
                  text={item.text}
                  idx={idx}
                  data-idx={idx}
                  predicates={item.predicates}
                  selectedPredicate={item.selectedPredicate}
                  onRemove={context.removeField}
                  changePredicate={changePredicate}
                  predicateValue={item.predicateValue}
                  input={item.input}
                  changePredicateValue={changePredicateValue}
                />
              );
            })}
          </ul>
        </div>

        <Row>
          <Col md={6} xs={12}>
            <Dropdown source={columns} valueField={'attribute'} titleField={'text'} isStatic onChange={context.addField}>
              <IcoBtn invert={'true'} icon="icon-down" className="btn_drop-down btn_r_8 btn_grey6">
                {t('select-journal.filters.add-criteria')}
              </IcoBtn>
            </Dropdown>
          </Col>
          <Col md={6} xs={12}>
            <div className="select-journal-filters__apply-button-wrapper">
              <Button
                className={'button_blue'}
                onClick={() => {
                  onApply(
                    context.fields.map(item => ({
                      t: item.selectedPredicate.value,
                      att: item.attribute,
                      value: item.predicateValue
                    }))
                  );
                }}
              >
                {t('select-journal.filters.apply-criteria')}
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    )}
  </FiltersContext.Consumer>
);

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
