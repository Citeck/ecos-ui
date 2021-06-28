import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import Filter from './Filter';
import { IcoBtn } from '../../common/btns';
import { getPredicates } from '../../Records/predicates/predicates';

import './Filter.scss';
import './InlineFilter.scss';

class InlineFilter extends Filter {
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      predicate: get(props, 'filter.predicate', {})
    };
  }

  componentDidUpdate() {}

  get valueClassNames() {
    return classNames(super.valueClassNames, 'ecos-inline-filter__value');
  }

  get selectorClassNames() {
    return classNames(super.selectorClassNames, 'ecos-inline-filter__selector');
  }

  get selectedPredicate() {
    const {
      filter: {
        meta: { column }
      }
    } = this.props;
    const predicate = get(this.state, 'predicate', {});
    const predicates = getPredicates(column);
    const fullPredicateInfo = get(predicates.filter(p => [predicate.value, predicate.t].includes(p.value)), [0], predicates[0]);

    return {
      ...predicate,
      ...fullPredicateInfo,
      val: this.state.value
    };
  }

  get valueControlProps() {
    const predicate = this.selectedPredicate;

    return {
      ...super.valueControlProps,
      predicate,
      value: this.state.value
    };
  }

  handleConfirmAction = () => {
    this.props.onFilter(this.selectedPredicate);
    this.props.onToggle();
  };

  renderConfirmAction() {
    const btnClasses = 'ecos-btn_i ecos-btn_transparent ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height';

    return (
      <IcoBtn
        icon="icon-small-check"
        className={classNames(btnClasses, 'ecos-inline-filter__actions-confirm')}
        onClick={this.handleConfirmAction}
      />
    );
  }

  onChangePredicate = predicate => {
    this.setState({ predicate });
  };

  onChangeValue = value => {
    this.setState({ value });
  };

  render() {
    const { className, children } = this.props;

    return (
      <div className={classNames('ecos-inline-filter', className)}>
        {children}

        <div className="ecos-inline-filter__body">
          {this.renderSelector()}
          {this.renderValue()}
          <div className="ecos-inline-filter__actions">
            {this.renderDeleteAction()}
            {this.renderConfirmAction()}
          </div>
        </div>
      </div>
    );
  }
}

export default InlineFilter;
