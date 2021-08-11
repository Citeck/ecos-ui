import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import replace from 'lodash/replace';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import { Tooltip } from 'reactstrap';
import moment from 'moment';

import { getId, isExistValue, trigger } from '../../../../../../helpers/util';
import ClickOutside from '../../../../../ClickOutside';
import { Icon, Tooltip as EcosTooltip } from '../../../../';
import { Dropdown, Input } from '../../../../form';
import {
  PREDICATE_CONTAINS,
  PREDICATE_EQ,
  PREDICATE_GE,
  PREDICATE_GT,
  PREDICATE_LE,
  PREDICATE_LT,
  PREDICATE_NOT_EQ
} from '../../../../../Records/predicates/predicates';
import { DataFormatTypes } from '../../../../../../constants';
import { DatePicker } from '../../../../form';
import { IcoBtn } from '../../../../btns';

import './HeaderFormatter.scss';

export default class HeaderFormatter extends Component {
  #datePickerSelectorData = [
    {
      value: '    ',
      key: null
    },
    {
      value: '=',
      key: PREDICATE_EQ
    },
    {
      value: '!=',
      key: PREDICATE_NOT_EQ
    },
    {
      value: '>',
      key: PREDICATE_GT
    },
    {
      value: '>=',
      key: PREDICATE_GE
    },
    {
      value: '<',
      key: PREDICATE_LT
    },
    {
      value: '<=',
      key: PREDICATE_LE
    }
  ];

  constructor(props) {
    super(props);

    this.thRef = React.createRef();
    this._id = getId();
    this.fetchValue = false;
    this.state = {
      open: false,
      date: null,
      predicateValue: get(props, 'filter.t', null)
    };
  }

  componentDidMount() {
    const { column, filterValue } = this.props;
    const formatter = get(column, 'formatExtraData.formatter.getDisplayText', null);
    const value = formatter && formatter(filterValue);

    if (value instanceof Promise) {
      this.fetchValue = true;
      value.then(text => {
        if (this.fetchValue) {
          this.setState({ text, first: text });
          this.fetchValue = false;
        }
      });
    } else {
      if (this.typeIsDate(column.type)) {
        this.setState({ date: filterValue });
      } else {
        this.setState({ text: filterValue, first: filterValue });
      }
    }
  }

  componentWillUnmount() {
    this.fetchValue = false;
  }

  get activeFilter() {
    const { text, open, date } = this.state;
    return text || date || open;
  }

  get indentation() {
    const { filterable, sortable } = this.props;
    const actions = [filterable, sortable].filter(act => act);

    return actions.length * 30;
  }

  typeIsDate = type => [DataFormatTypes.DATETIME, DataFormatTypes.DATE].includes(type);

  onToggle = e => {
    const open = !this.state.open;
    this.setState({ open });
    e && e.stopPropagation();
  };

  onChange = e => {
    const text = e.target.value;

    this.setState({ text });
  };

  onChangeDate = (value, event) => {
    const { column } = this.props;
    const date = moment(value)
      .utc()
      .format();

    this.setState({ date });

    if (event.key === 'Enter') {
      this.triggerPendingChange(date, column.dataField);
    }
  };

  onKeyDown = e => {
    const { text, first } = this.state;

    if (e.key === 'Enter' && text !== first) {
      this.triggerPendingChange(text, this.props.column.dataField);
    }
  };

  onSelectDate = (date, event) => {
    const { column } = this.props;

    if (event.key === 'Enter') {
      this.triggerPendingChange(
        moment(date)
          .utc()
          .format(),
        column.dataField
      );
    }
  };

  onClear = () => {
    const { column } = this.props;

    this.setState({ text: '', date: null });
    this.triggerPendingChange('', column.dataField, column.type);
  };

  triggerPendingChange = debounce((val, dataField, type) => {
    const { onFilter, column } = this.props;
    const { predicateValue } = this.state;

    this.onToggle();

    if (isFunction(onFilter)) {
      onFilter(
        [
          {
            att: dataField,
            t: predicateValue || PREDICATE_CONTAINS,
            val: typeof val === 'string' ? val.trim() : val
          }
        ],
        type || column.type
      );
    }
  }, 0);

  onDividerMouseDown = e => {
    const { colIndex } = this.props;
    const current = this.thRef.current;

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-803
    e.stopPropagation();

    trigger.call(this, 'onDividerMouseDown', {
      e: e,
      th: current.parentElement,
      colIndex,
      minW: this.indentation ? this.indentation + 20 : undefined
    });
  };

  onSort = () => {
    const { ascending, column, sortable, onSort } = this.props;

    if (sortable && onSort) {
      onSort({ ascending, column });
    }
  };

  onChangePredicate = predicate => {
    this.setState({ predicateValue: predicate.key });
  };

  onApplyDate = () => {
    const { column } = this.props;
    const { date } = this.state;

    this.triggerPendingChange(date, column.dataField);
  };

  renderDatePicker() {
    const { column } = this.props;
    const { date, predicateValue } = this.state;
    const withTime = column.type === DataFormatTypes.DATETIME;

    return (
      <div className="ecos-th__filter-tooltip-datepicker">
        <Dropdown
          source={this.#datePickerSelectorData}
          className="ecos-th__filter-tooltip-datepicker-predicate"
          toggleClassName="ecos-th__filter-tooltip-datepicker-predicate-toggle"
          valueField="key"
          titleField="value"
          value={predicateValue}
          onChange={this.onChangePredicate}
        />
        <div className="position-relative">
          <DatePicker
            showTimeInput={withTime}
            dateFormat={column.type === DataFormatTypes.DATETIME ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy'}
            showIcon
            shouldCloseOnSelect
            selected={date}
            onChange={this.onChangeDate}
            onSelect={this.onSelectDate}
          />

          {this.renderCloseButton()}
        </div>

        <IcoBtn
          icon="icon-small-check"
          className="ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_green ecos-btn_hover_t_light-green ecos-btn_transparent ecos-th__filter-tooltip-datepicker-apply"
          onClick={this.onApplyDate}
        />
      </div>
    );
  }

  renderCloseButton = () => <Icon className="ecos-th__filter-tooltip-close icon-small-close icon_small" onClick={this.onClear} />;

  renderInput() {
    const { column } = this.props;

    if ([DataFormatTypes.DATETIME, DataFormatTypes.DATE].includes(column.type)) {
      return this.renderDatePicker();
    }

    const { text } = this.state;

    return (
      <>
        <Input
          autoFocus
          type="text"
          className="ecos-th__filter-tooltip-input"
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          value={text}
        />
        {this.renderCloseButton()}
      </>
    );
  }

  renderFilter = () => {
    const { column } = this.props;
    const { open } = this.state;
    const filterIcon = document.getElementById(this.id);

    return (
      <Tooltip
        id={this.tooltipId}
        target={this.id}
        isOpen={open}
        trigger={'click'}
        placement="top"
        boundariesElement={'window'}
        className={classNames('ecos-th__filter-tooltip', {
          'ecos-th__filter-tooltip_date': this.typeIsDate(column.type)
        })}
        innerClassName="ecos-th__filter-tooltip-body"
        arrowClassName="ecos-th__filter-tooltip-marker"
      >
        <ClickOutside handleClickOutside={e => this.state.open && this.onToggle(e)} excludeElements={[filterIcon]}>
          {this.renderInput()}
        </ClickOutside>
      </Tooltip>
    );
  };

  renderActions = () => {
    const { filterable, ascending, sortable } = this.props;

    if (!filterable && !sortable) {
      return null;
    }

    return (
      <div className="ecos-th__actions">
        {sortable && (
          <Icon
            className={classNames('ecos-th__order ecos-th__action-icon', {
              'ecos-th__action-icon_active': isExistValue(ascending),
              'icon-small-up': ascending,
              'icon-small-down': !ascending
            })}
          />
        )}
        {filterable && (
          <Icon
            id={this.id}
            className={classNames('ecos-th__filter-icon ecos-th__action-icon icon-small-filter', {
              'ecos-th__action-icon_active': this.activeFilter
            })}
            onClick={this.onToggle}
          />
        )}
      </div>
    );
  };

  render() {
    const { column = {}, filterable, sortable } = this.props;

    this.id = `filter-${replace(column.dataField, /[\W]*/g, '')}-${this._id}`;
    this.tooltipId = `tooltip-${this.id}`;
    this.tooltipTextId = `tooltip-text-${this.id}`;

    return (
      <div
        ref={this.thRef}
        className={classNames('ecos-th', {
          'ecos-th_filtered': this.activeFilter,
          'ecos-th_sortable': sortable
        })}
      >
        <div className="ecos-th__content" onClick={this.onSort} style={{ paddingRight: this.indentation }}>
          <EcosTooltip target={this.tooltipTextId} text={column.text} placement="bottom" trigger="hover" uncontrolled autohide showAsNeeded>
            <span id={this.tooltipTextId} className="ecos-th__content-text">
              {column.text}
            </span>
          </EcosTooltip>
          {this.renderActions()}
        </div>
        {filterable && this.renderFilter()}
        <div className="ecos-th__divider" onMouseDown={this.onDividerMouseDown} />
      </div>
    );
  }
}

HeaderFormatter.propTypes = {
  filterable: PropTypes.bool,
  closeFilterEvent: PropTypes.string,
  filterValue: PropTypes.string,
  onFilter: PropTypes.func,

  ascending: PropTypes.bool,
  sortable: PropTypes.bool,
  onSort: PropTypes.func,

  column: PropTypes.object,
  colIndex: PropTypes.number,
  onDividerMouseDown: PropTypes.func
};
