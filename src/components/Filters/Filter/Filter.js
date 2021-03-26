import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import { t } from '../../../helpers/util';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns';
import { Label, Select } from '../../common/form';
import { getPredicateInput, getPredicates } from '../../Records/predicates/predicates';
import EditorService from '../../Journals/service/editors/EditorService';
import EditorScope from '../../Journals/service/editors/EditorScope';
import ParserPredicate from '../predicates/ParserPredicate';

import './Filter.scss';

const WITHOUT_VAL = ParserPredicate.predicatesWithoutValue;

export default class Filter extends Component {
  static propTypes = {
    filter: PropTypes.object,
    needUpdate: PropTypes.bool,
    onChangeValue: PropTypes.func,
    onChangePredicate: PropTypes.func,
    onDelete: PropTypes.func
  };

  static defaultProps = {
    onChangeValue: _ => _,
    onChangePredicate: _ => _,
    onDelete: _ => _
  };

  constructor(props) {
    super(props);

    this.state = {
      value: get(props, 'filter.predicate.val', ''),
      hasDataEntry: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const prevValue = get(prevProps, 'filter.predicate.val', '');
    const currentValue = get(this.props, 'filter.predicate.val', '');
    const { value, hasDataEntry } = this.state;

    if (!prevProps.needUpdate && this.props.needUpdate && value !== currentValue) {
      this.setState({ value: currentValue });
    }

    if (hasDataEntry) {
      return;
    }

    if (prevValue !== currentValue || currentValue !== value) {
      this.setState({ value: currentValue });
    }
  }

  componentWillUnmount() {
    this.handleChangeValue.cancel();
  }

  onChangeValue = value => {
    this.setState({ value, hasDataEntry: true }, this.handleChangeValue);
  };

  handleChangeValue = debounce(
    () => {
      const { value: val } = this.state;
      const { index } = this.props;

      this.props.onChangeValue({ val, index });
      this.setState({ isInput: false });
    },
    350,
    { leading: true, trailing: false }
  );

  onChangePredicate = ({ fixedValue, value: predicate }) => {
    const { index } = this.props;

    this.props.onChangePredicate({ predicate, index });

    if (fixedValue !== undefined) {
      this.onChangeValue(fixedValue);
    } else if (WITHOUT_VAL.includes(predicate)) {
      this.onChangeValue('');
    }
  };

  onDeletePredicate = () => {
    this.props.onDelete(this.props.index);
  };

  getSelectedPredicate = (predicates, predicate) => {
    return predicates.filter(p => p.value === predicate.t)[0] || predicates[0];
  };

  ValueControl = React.memo((props, context) => {
    const {
      value,
      filter: {
        meta: { column },
        predicate = {}
      },
      sourceId,
      metaRecord
    } = props;
    const predicates = getPredicates(column);
    const selectedPredicate = this.getSelectedPredicate(predicates, predicate);
    const isShow = !WITHOUT_VAL.includes(predicate.t) && get(selectedPredicate, 'needValue', true);

    if (isShow) {
      const editorType = get(column, 'newEditor.type');

      if (EditorService.isRegistered(editorType)) {
        return EditorService.getEditorControl({
          recordRef: metaRecord,
          attribute: column.attribute,
          editor: column.newEditor,
          value,
          scope: EditorScope.FILTER,
          onUpdate: this.onChangeValue,
          predicate
        });
      }

      /** @see {@link EditorService} use it for all filter types*/
      const predicateInput = getPredicateInput(column, sourceId, metaRecord, predicate);

      const predicateProps = predicateInput.getProps({
        predicateValue: value,
        changePredicateValue: this.onChangeValue,
        datePickerWrapperClasses: 'ecos-filter_width_full',
        selectClassName: 'select_width_full'
      });

      const FilterValueComponent = predicateInput.component;

      return <FilterValueComponent {...predicateProps} />;
    }

    return null;
  });

  render() {
    const btnClasses = 'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height';
    const {
      className,
      children,
      filter: {
        meta: { column },
        predicate
      }
    } = this.props;
    const { value } = this.state;
    const predicates = getPredicates(column);
    const selectedPredicate = this.getSelectedPredicate(predicates, predicate);

    return (
      <div className={classNames('ecos-filter', className)}>
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={[{ sm: 3 }, { sm: 4 }, { sm: 4 }, { sm: 1 }]}
          cols={[
            <Label title={column.text} className={'ecos-filter__label ecos-filter_step label_clear label_bold label_middle-grey'}>
              {column.text}
            </Label>,
            <Select
              className={'ecos-filter_step ecos-filter_font_12 select_narrow select_width_full'}
              placeholder={t('journals.default')}
              options={predicates}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              value={selectedPredicate}
              onChange={this.onChangePredicate}
            />,
            <div className="ecos-filter__value-wrapper">
              <this.ValueControl {...this.props} value={value} />
            </div>,
            <div className="ecos-filter__actions">
              <IcoBtn
                icon={'icon-delete'}
                className={classNames(btnClasses, 'ecos-btn_hover_t_red ecos-btn_x-step_10')}
                onClick={this.onDeletePredicate}
              />
              <i className="ecos-btn__i ecos-btn__i_right icon-custom-drag-big ecos-filter__drag-ico" />
            </div>
          ]}
        />
      </div>
    );
  }
}
