import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import replace from 'lodash/replace';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import { Tooltip } from 'reactstrap';

import { closest, getId, isExistValue } from '../../../../../../helpers/util';
import { t } from '../../../../../../helpers/export/util';
import ClickOutside from '../../../../../ClickOutside';
import { Icon, Tooltip as EcosTooltip } from '../../../../';
import InlineFilter from '../../../../../../components/Filters/Filter/InlineFilter';
import { ParserPredicate } from '../../../../../Filters/predicates';

import './HeaderFormatter.scss';

const Labels = {
  COMPLEX_FILTER_LABEL_PART_1: 'journals.header-formatter.message.complex-filter.part-1',
  COMPLEX_FILTER_LABEL_PART_2: 'journals.header-formatter.message.complex-filter.part-2'
};

export default class HeaderFormatter extends Component {
  constructor(props) {
    super(props);

    this.thRef = React.createRef();
    this._id = getId();
    this.fetchValue = false;
    this.state = {
      open: false,
      predicate: {},
      isOpenLabelTooltip: false
    };
  }

  componentDidMount() {
    this._setFilterValue();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.filterValue !== this.props.filterValue) {
      this._setFilterValue();
    }
  }

  componentWillUnmount() {
    this.fetchValue = false;
    this.handleSetFilter.cancel();
  }

  _setFilterValue = () => {
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
      this.setState({ text: filterValue, first: filterValue });
    }
  };

  get activeFilter() {
    const { predicate } = this.props;
    const { text, open } = this.state;

    return text || open || (predicate.needValue === false && predicate.t) || ParserPredicate.predicatesWithoutValue.includes(predicate.t);
  }

  get indentation() {
    const { filterable, sortable } = this.props;
    const actions = [filterable, sortable].filter(act => act);

    return actions.length * 30;
  }

  onToggle = e => {
    const open = !this.state.open;

    this.setState({ open });
    e && e.stopPropagation();
  };

  onChange = e => {
    const text = e.target.value;

    this.setState({ text });
  };

  onKeyDown = e => {
    const { column } = this.props;
    const { text, first } = this.state;

    if (e.key === 'Enter' && text !== first) {
      this.triggerPendingChange(text, column.dataField, column.type);
    }
  };

  onClear = () => {
    const { column } = this.props;

    this.setState({ text: '' });
    this.triggerPendingChange('', column.dataField, column.type);
  };

  triggerPendingChange = debounce((text, dataField, type) => {
    const { column, onFilter } = this.props;
    const { predicate } = this.state;

    this.onToggle();

    if (isFunction(onFilter)) {
      onFilter(
        [
          {
            att: dataField,
            t: get(predicate, 't', ''),
            val: text.trim()
          }
        ],
        type || column.type
      );
    }
  }, 0);

  onDividerMouseDown = e => {
    const { colIndex, onDividerMouseDown } = this.props;
    const current = this.thRef.current;

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-803
    e.stopPropagation();

    if (isFunction(onDividerMouseDown)) {
      onDividerMouseDown({
        e: e,
        th: current.parentElement,
        colIndex,
        minW: this.indentation ? this.indentation + 20 : undefined
      });
    }
  };

  onSort = () => {
    const { ascending, column, sortable, onSort } = this.props;

    if (sortable && onSort) {
      onSort({ ascending, column });
    }
  };

  handleChangeFilterValue = ({ val }) => {
    this.setState(
      state => ({
        predicate: {
          ...state.predicate,
          val
        }
      }),
      this.handleSetFilter
    );
  };

  handleSetFilter = debounce(() => {
    this.props.onFilter(
      [
        {
          ...this.props.predicate,
          ...this.state.predicate,
          att: get(this.props, 'column.attribute') || get(this.props, 'column.dataField')
        }
      ],
      get(this.props, 'column.type')
    );
  }, 150);

  handleFilter = data => {
    const { onFilter, predicate, column } = this.props;

    onFilter(
      [
        {
          ...predicate,
          ...data,
          value: data.val,
          t: data.t || data.value,
          att: column.attribute || column.dataField
        }
      ],
      column.type
    );
  };

  handleChangeFilterPredicate = ({ predicate }) => {
    this.setState(
      state => ({
        predicate: {
          ...state.predicate,
          t: predicate
        }
      }),
      this.handleSetFilter
    );
  };

  handleClickOutside = e => {
    if (closest(e.target, 'modal') || closest(e.target, 'date-editor-container') || closest(e.target, 'select__option', true)) {
      return;
    }

    this.state.open && this.onToggle(e);
  };

  handleOpenSettings = () => {
    const { onOpenSettings } = this.props;

    if (isFunction(onOpenSettings)) {
      onOpenSettings();

      this.state.open && this.onToggle();
    }
  };

  handleToggleLabelTooltip = () => {
    this.setState(state => ({ isOpenLabelTooltip: !state.isOpenLabelTooltip }));
  };

  renderFilter = () => {
    const { filterable, isComplexFilter } = this.props;

    if (!filterable) {
      return null;
    }

    let tooltipBody = (
      <div className="ecos-th__filter-tooltip-message">
        {t(Labels.COMPLEX_FILTER_LABEL_PART_1)}
        <span className="pseudo-link" onClick={this.handleOpenSettings}>
          {t(Labels.COMPLEX_FILTER_LABEL_PART_2)}
        </span>
      </div>
    );

    if (!isComplexFilter) {
      const { column, predicate } = this.props;
      const { text } = this.state;

      tooltipBody = (
        <InlineFilter
          filter={{
            meta: {
              column,
              condition: {}
            },
            predicate: {
              ...predicate,
              val: text
            }
          }}
          onChangeValue={this.handleChangeFilterValue}
          onChangePredicate={this.handleChangeFilterPredicate}
          onFilter={this.handleFilter}
          onDelete={this.onClear}
          onToggle={this.onToggle}
        />
      );
    }

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
        className="ecos-th__filter-tooltip"
        innerClassName="ecos-th__filter-tooltip-body"
        arrowClassName="ecos-th__filter-tooltip-marker"
      >
        <ClickOutside handleClickOutside={this.handleClickOutside} excludeElements={[filterIcon, ...document.querySelectorAll('.modal')]}>
          {tooltipBody}
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
    const { column = {}, sortable } = this.props;
    const { isOpenLabelTooltip } = this.state;

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
          <EcosTooltip
            target={this.tooltipTextId}
            text={column.text}
            placement="bottom"
            trigger="hover"
            showAsNeeded
            isOpen={isOpenLabelTooltip}
            onToggle={this.handleToggleLabelTooltip}
          >
            <span id={this.tooltipTextId} className="ecos-th__content-text">
              {column.text}
            </span>
          </EcosTooltip>

          {this.renderActions()}
        </div>
        {this.renderFilter()}
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
  onDividerMouseDown: PropTypes.func,

  isComplexFilter: PropTypes.bool,
  predicate: PropTypes.object,
  onOpenSettings: PropTypes.func
};
