import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';

import { t } from '../../../helpers/util';
import ZIndex from '../../../services/ZIndex';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns';
import { Label, Select } from '../../common/form';
import { getPredicates, getPredicateValue, PREDICATE_LIST_WITH_CLEARED_VALUES } from '../../Records/predicates/predicates';
import EditorService from '../../Journals/service/editors/EditorService';
import EditorScope from '../../Journals/service/editors/EditorScope';
import { ParserPredicate } from '../predicates';

import './Filter.scss';

export default class Filter extends Component {
  _controls = new Map();
  #controlRef = null;

  static propTypes = {
    filter: PropTypes.object,
    needUpdate: PropTypes.bool,
    rowConfig: PropTypes.array,
    onChangeValue: PropTypes.func,
    onChangePredicate: PropTypes.func,
    onDelete: PropTypes.func
  };

  static defaultProps = {
    rowConfig: [{ sm: 3 }, { sm: 4 }, { sm: 4 }, { sm: 1 }],
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

    this.selectZIndex = ZIndex.calcZ();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !isEqual(omit(this.props, ['children']), omit(nextProps, ['children'])) || !isEqual(this.state, nextState);
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

  get type() {
    return 'base';
  }

  onChangeValue = (value, withoutValue) => {
    this.setState({ value, hasDataEntry: true }, () => this.handleChangeValue(withoutValue));
  };

  handleChangeValue = debounce(
    withoutValue => {
      const { value: val } = this.state;
      const { index, onChangeValue } = this.props;

      isFunction(onChangeValue) && onChangeValue({ val, index, withoutValue });
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
    } else if (ParserPredicate.predicatesWithoutValue.includes(predicate) || PREDICATE_LIST_WITH_CLEARED_VALUES.includes(predicate)) {
      this.onChangeValue('');
    }
  };

  onDeletePredicate = () => {
    this.props.onDelete(this.props.index);
  };

  getSelectedPredicate = (predicates, predicate) => {
    return predicates.filter(p => p.value === getPredicateValue(predicate))[0] || predicates[0];
  };

  get labelClassNames() {
    return 'ecos-filter__label ecos-filter_step label_clear label_bold label_middle-grey';
  }

  get selectorClassNames() {
    return 'ecos-filter_step ecos-filter_font_12 select_narrow select_width_full';
  }

  get valueClassNames() {
    return 'ecos-filter__value-wrapper ecos-filter_step';
  }

  get selectedPredicate() {
    const {
      filter: {
        meta: { column },
        predicate
      }
    } = this.props;
    const predicates = getPredicates(column);

    return this.getSelectedPredicate(predicates, predicate);
  }

  get valueControlProps() {
    const {
      filter: {
        meta: { column },
        predicate = {}
      }
    } = this.props;
    const { value } = this.state;

    return {
      ...this.props,
      column,
      predicate,
      value,
      forwardedRef: this.setControlRef
    };
  }

  get deleteActionIcon() {
    return 'icon-delete';
  }

  setControlRef = ref => {
    if (ref) {
      this.#controlRef = ref;
    }
  };

  handleMouseDown = () => {
    const { value } = this.state;
    const controlValue = get(this.#controlRef, 'value');

    if (controlValue !== undefined && value !== controlValue) {
      this.onChangeValue(controlValue);
    }
  };

  ValueControl = React.memo((props, context) => {
    const { value, predicate, column, metaRecord, forwardedRef, onKeyDown } = props;
    const predicates = getPredicates(column);
    const selectedPredicate = this.getSelectedPredicate(predicates, predicate);
    const isShow =
      !ParserPredicate.predicatesWithoutValue.includes(getPredicateValue(predicate)) && get(selectedPredicate, 'needValue', true);
    const editorType = get(column, 'newEditor.type');

    if (isShow && EditorService.isRegistered(editorType)) {
      const control = EditorService.getEditorControl({
        recordRef: metaRecord,
        forwardedRef,
        attribute: column.attribute,
        editor: column.newEditor,
        value,
        scope: EditorScope.FILTER,
        onUpdate: this.onChangeValue,
        onKeyDown,
        controlProps: { predicate: omit(predicate, 'val') }
      });

      if (this.type === 'base') {
        return control;
      }

      const key = JSON.stringify({
        column,
        metaRecord,
        predicate: omit(predicate, 'val')
      });
      const ControlComponent = this._controls.get(key);

      if (ControlComponent) {
        return ControlComponent;
      }

      this._controls.set(key, control);

      return control;
    }

    return null;
  });

  renderLabel() {
    const {
      filter: {
        meta: { column }
      }
    } = this.props;

    return (
      <Label title={column.text} className={this.labelClassNames}>
        {column.text}
      </Label>
    );
  }

  renderSelector() {
    const {
      filter: {
        meta: { column }
      }
    } = this.props;
    const predicates = getPredicates(column);

    return (
      <Select
        className={classNames(this.selectorClassNames, 'ecosZIndexAnchor')}
        placeholder={t('journals.default')}
        options={predicates}
        getOptionLabel={option => option.label}
        getOptionValue={option => option.value}
        value={this.selectedPredicate}
        onChange={this.onChangePredicate}
        styles={{ menuPortal: base => ({ ...base, zIndex: this.selectZIndex }) }}
        menuPortalTarget={document.body}
        menuPlacement="auto"
        closeMenuOnScroll={(e, { innerSelect }) => !innerSelect}
      />
    );
  }

  renderValue() {
    return (
      <div className={this.valueClassNames}>
        <this.ValueControl {...this.valueControlProps} />
      </div>
    );
  }

  renderDeleteAction() {
    const btnClasses = 'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height';

    return (
      <IcoBtn
        icon={this.deleteActionIcon}
        className={classNames(btnClasses, 'ecos-btn_hover_t_red ecos-btn_x-step_10')}
        onClick={this.onDeletePredicate}
      />
    );
  }

  renderDragAction() {
    return <i className="ecos-btn__i ecos-btn__i_right icon-custom-drag-big ecos-filter__drag-ico" />;
  }

  renderActions() {
    return (
      <div className="ecos-filter__actions">
        {this.renderDeleteAction()}
        {this.renderDragAction()}
      </div>
    );
  }

  render() {
    const { className, children, rowConfig } = this.props;

    return (
      <div
        className={classNames('ecos-filter', className)}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={this.handleMouseDown}
      >
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={rowConfig}
          cols={[this.renderLabel(), this.renderSelector(), this.renderValue(), this.renderActions()]}
        />
      </div>
    );
  }
}
