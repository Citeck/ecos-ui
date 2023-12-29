import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import debounce from 'lodash/debounce';
import replace from 'lodash/replace';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import isElement from 'lodash/isElement';
import ReactResizeDetector from 'react-resize-detector';

import { closest, getId } from '../../../../../../helpers/util';
import { getIconUpDown } from '../../../../../../helpers/icon';
import { t } from '../../../../../../helpers/export/util';
import ClickOutside from '../../../../../ClickOutside';
import Icon from '../../../../icons/Icon/Icon';
import EcosTooltip from '../../../../Tooltip';
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
      predicate: {}
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

    return (
      (!isUndefined(predicate.val) && predicate.val !== '') ||
      text ||
      open ||
      (predicate.needValue === false && predicate.t) ||
      ParserPredicate.predicatesWithoutValue.includes(predicate.t)
    );
  }

  get minWidth() {
    const current = this.thRef.current;
    let min = 0;

    if (isElement(current)) {
      const indentation = parseFloat(get(window.getComputedStyle(current), 'paddingRight', 0)) * 2;
      const actionsW = get(current.querySelector('.ecos-th__actions'), 'offsetWidth', 0);

      min = indentation + actionsW;
    }

    return `${Math.max(min, 10)}px`;
  }

  onToggle = e => {
    const open = !this.state.open;

    this.setState({ open });
    e && e.stopPropagation();
  };

  onClear = () => {
    const { column } = this.props;

    this.setState({ text: '' });
    this.triggerPendingChange('', column.dataField, column.type);
  };

  triggerPendingChange = debounce((text, dataField, type) => {
    const { column, onFilter, originPredicate } = this.props;
    const { predicate } = this.state;

    this.onToggle();

    isFunction(onFilter) &&
      onFilter(
        [
          {
            att: dataField,
            t: get(predicate, 't', '') || get(originPredicate, 't', ''),
            val: text.trim()
          }
        ],
        type || column.type
      );
  }, 0);

  onDividerMouseDown = e => {
    const { colIndex, onDividerMouseDown } = this.props;
    const current = this.thRef.current;

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-803
    e.stopPropagation();

    isFunction(onDividerMouseDown) &&
      onDividerMouseDown({
        e: e,
        th: current.parentElement,
        colIndex
      });
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
    const { onFilter, predicate, column, deselectAllRecords, clearSelectedState } = this.props;

    if (isFunction(deselectAllRecords)) {
      deselectAllRecords();
    }

    if (isFunction(clearSelectedState)) {
      clearSelectedState();
    }

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
      const { column, predicate, recordRef } = this.props;
      const { text } = this.state;

      tooltipBody = (
        <InlineFilter
          recordRef={recordRef}
          filter={{
            meta: {
              column,
              condition: {}
            },
            predicate: {
              ...predicate,
              val: get(predicate, 'val', text)
            }
          }}
          isRelativeToParent
          onChangeValue={this.handleChangeFilterValue}
          onChangePredicate={this.handleChangeFilterPredicate}
          onFilter={this.handleFilter}
          onDelete={this.onClear}
          onToggle={this.onToggle}
        />
      );
    }

    const { open } = this.state;
    const filterIcon = document.getElementById(this.tooltipFilterId);

    return (
      <Tooltip
        target={this.tooltipFilterId}
        isOpen={open}
        trigger="click"
        placement="top"
        boundariesElement="window"
        className="ecos-th__filter-tooltip"
        innerClassName="ecos-th__filter-tooltip-body"
        arrowClassName="ecos-th__filter-tooltip-marker"
        modifiers={{
          offsetsCorrection: {
            order: 840,
            enabled: true,
            fn: data => {
              const {
                popper,
                offsets,
                instance: { popper: popperEl }
              } = data;
              const { clientWidth } = popperEl.offsetParent;

              if (popper.right > clientWidth) {
                popper.right = clientWidth;
                popper.left = popper.right - popper.width;

                offsets.popper = {
                  ...offsets.popper,
                  ...popper
                };

                offsets.arrow.left -= 20;
              }

              if (popper.left < 0) {
                popper.left = 0;
                popper.right = popper.width;

                offsets.popper = {
                  ...offsets.popper,
                  ...popper
                };

                offsets.arrow.left += 20;
              }

              return data;
            }
          }
        }}
      >
        <ReactResizeDetector handleWidth onResize={() => this.forceUpdate()}>
          <ClickOutside handleClickOutside={this.handleClickOutside} excludeElements={[filterIcon, ...document.querySelectorAll('.modal')]}>
            {tooltipBody}
          </ClickOutside>
        </ReactResizeDetector>
      </Tooltip>
    );
  };

  renderActions = () => {
    const { disableSelect, filterable, ascending, sortable } = this.props;

    if (!filterable && !sortable) {
      return null;
    }

    const renderFilter = !disableSelect || (disableSelect && this.activeFilter);

    return (
      <div className="ecos-th__actions">
        {sortable && (
          <Icon
            className={classNames('ecos-th__order ecos-th__action-icon', getIconUpDown(ascending), {
              'ecos-th__action-icon_active': !isNil(ascending)
            })}
          />
        )}
        {filterable && (
          <Icon
            id={this.tooltipFilterId}
            className={classNames('ecos-th__filter-icon ecos-th__action-icon icon-small-filter', {
              'ecos-th__action-icon_active': this.activeFilter,
              'ecos-th__action-icon_hidden': !renderFilter
            })}
            onClick={this.onToggle}
          />
        )}
      </div>
    );
  };

  render() {
    const { column = {}, sortable } = this.props;
    const id = `${replace(column.dataField, /[\W]*/g, '')}-${this._id}`;

    this.tooltipFilterId = `filter-${id}`;
    this.tooltipLabelId = `label-${id}`;
    this.tooltipTextId = `text-${id}`;

    return (
      <div
        ref={this.thRef}
        className={classNames('ecos-th', {
          'ecos-th_filtered': this.activeFilter,
          'ecos-th_sortable': sortable
        })}
        style={{ minWidth: this.minWidth }}
      >
        <div className="ecos-th__content" onClick={this.onSort} id={this.tooltipLabelId}>
          <EcosTooltip
            target={this.tooltipLabelId}
            elementId={this.tooltipTextId}
            text={column.text}
            placement="bottom"
            uncontrolled
            showAsNeeded
          >
            <span className="ecos-th__content-text" id={this.tooltipTextId}>
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
  filterValue: PropTypes.any, //depends on field's type
  recordRef: PropTypes.string,
  onFilter: PropTypes.func,

  ascending: PropTypes.bool,
  sortable: PropTypes.bool,
  onSort: PropTypes.func,

  column: PropTypes.object,
  colIndex: PropTypes.number,
  onDividerMouseDown: PropTypes.func,

  isComplexFilter: PropTypes.bool,
  predicate: PropTypes.object,
  originPredicate: PropTypes.object,
  onOpenSettings: PropTypes.func,

  deselectAllRecords: PropTypes.func,
  clearSelectedState: PropTypes.func
};
