import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';
import { Col, Row } from 'reactstrap';

import { t } from '../../../../../helpers/util';
import ParserPredicate from '../../../../Filters/predicates/ParserPredicate';
import { Btn, IcoBtn } from '../../../../common/btns';
import Dropdown from '../../../../common/form/Dropdown';
import Filter from '../Filter';
import { Labels, SELECT_JOURNAL_MODAL_CLASSNAME } from '../constants';

import FiltersContext from './FiltersContext';

import './Filters.scss';

class Filters extends React.Component {
  constructor(props) {
    super(props);
    this.wrapperRef = React.createRef();
  }

  componentWillUnmount() {
    this.onKeydown.cancel();
  }

  /**
   * Checks if this modal is the topmost by data-level
   * @returns {boolean}
   */
  isTopLevelModal() {
    const wrapper = this.wrapperRef.current;
    if (!wrapper) {
      return true;
    }

    const parentModal = wrapper.closest(`.${SELECT_JOURNAL_MODAL_CLASSNAME}`);
    if (!parentModal) {
      return true;
    }

    const currentLevel = parseInt(parentModal.dataset.level, 10) || 0;

    const modals = document.querySelectorAll(`.${SELECT_JOURNAL_MODAL_CLASSNAME}`);
    for (let i = 0; i < modals.length; i++) {
      const lvl = parseInt(modals[i].dataset.level, 10) || 0;
      if (lvl > currentLevel) {
        return false;
      }
    }

    return true;
  }

  onApply = () => {
    if (!this.isTopLevelModal()) {
      return;
    }

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

  onReset = () => {
    const { resetFields } = this.context;
    resetFields();
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
      <div className="select-journal-filters" onKeyDown={this.onKeydown} ref={this.wrapperRef}>
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
      text: PropTypes.string
    })
  ),
  onApply: PropTypes.func
};

export default Filters;
