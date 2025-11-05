import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import EditorScope from '../../Journals/service/editors/EditorScope';
import EditorService from '../../Journals/service/editors/EditorService';
import { getPredicates, getPredicateValue, PREDICATE_TODAY } from '../../Records/predicates/predicates';
import { IcoBtn } from '../../common/btns';
import { Label, Select } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import { ParserPredicate } from '../predicates';

import { IGNORED_EVENT_ATTRIBUTE } from '@/constants';
import { handleCloseMenuOnScroll, t } from '@/helpers/util';
import ZIndex from '@/services/ZIndex';

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
      initialValue: get(props, 'filter.predicate.val', ''),
      hasDataEntry: false,
      zIndex: ZIndex.calcZ()
    };
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const zIndex = ZIndex.calcZ() + 1;
    return (
      !isEqual(omit(this.props, ['children']), omit(nextProps, ['children'])) ||
      !isEqual(this.state, nextState) ||
      this.state.zIndex !== zIndex
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const prevValue = get(prevProps, 'filter.predicate.val', '');
    const currentValue = get(this.props, 'filter.predicate.val', '');
    const { value, hasDataEntry } = this.state;

    if (!prevProps.needUpdate && this.props.needUpdate && value !== currentValue) {
      this.setState({ value: currentValue });
    }

    const zIndex = ZIndex.calcZ() + 1;
    if (zIndex !== this.state.zIndex) {
      this.setState({ zIndex });
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

    if (fixedValue !== undefined && predicate !== PREDICATE_TODAY) {
      this.onChangeValue(fixedValue);
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
    const predicates = column.predicates || getPredicates(column);

    return this.getSelectedPredicate(predicates, predicate);
  }

  get valueControlProps() {
    const {
      filter: {
        meta: { column },
        predicate = {}
      }
    } = this.props;
    const { value, initialValue } = this.state;

    return {
      ...this.props,
      column,
      predicate,
      value,
      initialValue,
      forwardedRef: this.setControlRef
    };
  }

  get deleteActionIcon() {
    return 'icon-delete';
  }

  getEditor = column => column.newEditor;

  setControlRef = ref => {
    if (ref) {
      this.#controlRef = ref;
    }
  };

  handleMouseDown = e => {
    const { value } = this.state;
    const controlValue = get(this.#controlRef, 'value');

    if (controlValue !== undefined && value !== controlValue && !e[IGNORED_EVENT_ATTRIBUTE]) {
      this.onChangeValue(controlValue);
    }
  };

  ValueControl = React.memo((props, context) => {
    const { value, predicate, initialValue, column, metaRecord, forwardedRef, onKeyDown, isRelativeToParent } = props;
    const predicates = column.predicates || getPredicates(column);
    const selectedPredicate = this.getSelectedPredicate(predicates, predicate);
    const isShow =
      !ParserPredicate.predicatesWithoutValue.includes(getPredicateValue(predicate)) && get(selectedPredicate, 'needValue', true);
    const editor = this.getEditor(column);
    const editorType = get(editor, 'type');

    if (isShow && EditorService.isRegistered(editorType)) {
      const control = EditorService.getEditorControl({
        recordRef: metaRecord,
        forwardedRef,
        attribute: column.attribute,
        editor,
        value,
        scope: EditorScope.FILTER,
        onUpdate: this.onChangeValue,
        onKeyDown,
        controlProps: { predicate: omit(predicate, 'val'), initialValue: get(predicate, 'val', '') },
        isRelativeToParent
      });

      const key = JSON.stringify({
        column,
        metaRecord,
        predicate: omit(predicate, 'val')
      });
      const ControlComponent = this._controls.get(key);

      if (React.isValidElement(ControlComponent) && get(ControlComponent, 'props.deps.initialValue', '') === initialValue) {
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
    const predicates = column.predicates || getPredicates(column);
    const { zIndex } = this.state;

    return (
      <Select
        className={classNames(this.selectorClassNames, 'ecosZIndexAnchor')}
        placeholder={t('journals.default')}
        options={predicates}
        getOptionLabel={option => option.label}
        getOptionValue={option => option.value}
        value={predicates.find(el => el.value === this.selectedPredicate.value) || predicates[0]}
        onChange={this.onChangePredicate}
        styles={{ menuPortal: base => ({ ...base, zIndex }) }}
        menuPortalTarget={document.body}
        menuPlacement="auto"
        closeMenuOnScroll={(e, { innerSelect }) => handleCloseMenuOnScroll(e, innerSelect)}
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
        className={classNames(btnClasses, 'ecos-btn_hover_t_red ecos-btn_x-step_10', 'fitnesse-ecos-inline-filter__actions-delete')}
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
    const { className, children, rowConfig, filter } = this.props;

    if (!get(filter, 'meta.column.searchable')) {
      return null;
    }

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
