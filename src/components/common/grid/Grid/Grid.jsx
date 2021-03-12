import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { Scrollbars } from 'react-custom-scrollbars';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import pick from 'lodash/pick';

import { closest, getId, isExistValue, isInViewport, t, trigger } from '../../../../helpers/util';
import Checkbox from '../../form/Checkbox/Checkbox';
import { COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME } from '../../../Records/predicates/predicates';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';
import FormatterService from '../../../Journals/service/formatters/FormatterService';
import ErrorCell from '../ErrorCell';
import ErrorTable from '../ErrorTable';

import './Grid.scss';

const CLOSE_FILTER_EVENT = 'closeFilterEvent';
const ECOS_GRID_HOVERED_CLASS = 'ecos-grid_hovered';
const ECOS_GRID_GRAG_CLASS = 'ecos-grid_drag';
const ECOS_GRID_ROW_CLASS = 'ecos-grid__row';
const REACT_BOOTSTRAP_TABLE_CLASS = 'react-bootstrap-table';

const ECOS_GRID_CHECKBOX_DIVIDER_CLASS = 'ecos-grid__checkbox-divider';
const ECOS_GRID_HEAD_SHADOW = 'ecos-grid__head-shadow';
const ECOS_GRID_LEFT_SHADOW = 'ecos-grid__left-shadow';

const Selector = ({ mode, ...rest }) => (
  <div className="ecos-grid__checkbox">
    <Checkbox checked={rest.checked} disabled={rest.disabled} />
  </div>
);

const SelectorHeader = ({ indeterminate, ...rest }) => (
  <div className="ecos-grid__checkbox">
    {rest.mode === 'checkbox' ? <Checkbox indeterminate={indeterminate} checked={rest.checked} disabled={rest.disabled} /> : null}
    <div className={ECOS_GRID_CHECKBOX_DIVIDER_CLASS} />
  </div>
);

const MIN_TH_WIDTH = 60;
const MAX_START_TH_WIDTH = 500;

class Grid extends Component {
  #columnsSizes = {};
  #isAllSelected = false;
  #gridRef = null;

  constructor(props) {
    super(props);
    this._selected = [];
    this._id = getId();
    this._resizingTh = null;
    this._startResizingThOffset = 0;
    this._keyField = props.keyField || 'id';
    this._scrollValues = {};
    this._tr = null;
    this._dragTr = null;
    this._tableDom = null;
    this._ref = React.createRef();
    this._scrollRef = null;
    this._shadowHeadNode = null;
    this._shadowLeftNode = null;
    this._firstHeaderCellNode = null;
    this._inlineActionsNode = null;
    this._optionMinWidth = null;

    this.state = {
      tableHeight: 0
    };
  }

  componentDidMount() {
    this.createCloseFilterEvent();
    this.createKeydownEvents();
    this.createDragEvents();

    const current = this._ref.current;

    if (current) {
      this._shadowHeadNode = current.getElementsByClassName(ECOS_GRID_HEAD_SHADOW)[0];
      this._shadowLeftNode = current.getElementsByClassName(ECOS_GRID_LEFT_SHADOW)[0];
      this._firstHeaderCellNode = current.querySelector(`thead > tr > th:first-child .${ECOS_GRID_CHECKBOX_DIVIDER_CLASS}`);
      this._inlineActionsNode = current.querySelector('.ecos-inline-tools-actions');

      this._timeoutDefaultWidth = setTimeout(this.setDefaultWidth, 1);
    }

    this.checkScrollPosition();

    if (this.props.resizableColumns) {
      this.createColumnResizeEvents();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { resizableColumns } = this.props;

    if (this.#gridRef) {
      this._tableDom = this.#gridRef.querySelector('table');
    }

    if (prevProps.resizableColumns !== resizableColumns) {
      resizableColumns ? this.createColumnResizeEvents() : this.removeColumnResizeEvents();
    }

    this.setColumnsSizes();
    this.checkScrollPosition();
  }

  componentWillUnmount() {
    this.removeCloseFilterEvent();
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
    this.removeDragEvents();
    clearTimeout(this._timeoutDefaultWidth);
  }

  get hasCheckboxes() {
    const { singleSelectable, multiSelectable } = this.props;

    return singleSelectable || multiSelectable;
  }

  get fixedHeader() {
    const { freezeCheckboxes, fixedHeader } = this.props;

    return (freezeCheckboxes && this.hasCheckboxes) || fixedHeader;
  }

  setGridRef = ref => {
    if (!ref) {
      return;
    }

    const { forwarderRef } = this.props;

    if (typeof forwarderRef === 'function') {
      forwarderRef(ref);
    }

    this.#gridRef = ref;
  };

  /**
   * Fixes loss of column sizes when redrawing a component
   */
  setColumnsSizes = () => {
    if (!this._tableDom) {
      return;
    }

    if (!Object.keys(this.#columnsSizes).length) {
      return;
    }

    const rows = this._tableDom.rows;

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0, row = rows[i]; j < row.cells.length; j++) {
        let cell = row.cells[j];

        if (!cell) {
          continue;
        }

        let { width = 0 } = get(this.#columnsSizes, `[${j}]`, {});

        if (!width) {
          continue;
        }

        cell.style.width = `${width}px`;
      }
    }
  };

  setDefaultWidth = () => {
    !this._startResizingThOffset &&
      this._ref.current &&
      this._ref.current.querySelectorAll('.ecos-grid__td').forEach(cellEl => {
        if (cellEl) {
          const td = cellEl.closest('td');
          const table = cellEl.closest('table');
          const container = table.parentElement;
          const checkbox = table.querySelector('.ecos-grid__checkbox');
          const cellLen = table.rows[0].cells.length - (checkbox ? 1 : 0);
          const proratedSizeCell = (container.clientWidth - (checkbox ? checkbox.clientWidth : 0)) / cellLen;
          const clearedSizeCell = Math.floor(proratedSizeCell / 10) * 10;
          const max = clearedSizeCell > MAX_START_TH_WIDTH ? clearedSizeCell : MAX_START_TH_WIDTH;

          if (cellLen > 1 && table.clientWidth > container.clientWidth && td.clientWidth > max) {
            td.style.width = `${max}px`;
          }
        }
      });
  };

  checkScrollPosition() {
    const { scrollPosition = {} } = this.props;
    const { scrollLeft, scrollTop } = scrollPosition;

    if (this._scrollRef && scrollLeft !== undefined) {
      this._scrollRef.scrollLeft(scrollLeft);
    }

    if (this._scrollRef && scrollTop !== undefined) {
      this._scrollRef.scrollTop(scrollTop);
    }
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown);
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  createDragEvents() {
    if (this.props.onRowDrop) {
      document.addEventListener('dragenter', this.onDragEnter);
    }
  }

  removeDragEvents() {
    if (this.props.onRowDrop) {
      document.removeEventListener('dragenter', this.onDragEnter);
    }
  }

  onKeydown = e => {
    if (this.props.changeTrOptionsByRowClick) {
      const tr = this._tr;

      switch (e.keyCode) {
        case 38:
          if (tr && tr.previousSibling) {
            this.getTrOptions(tr.previousSibling);
            this.onRowClick(tr.previousSibling);
          }

          break;
        case 40:
          if (tr && tr.nextSibling) {
            this.getTrOptions(tr.nextSibling);
            this.onRowClick(tr.nextSibling);
          }
          break;
        default:
          break;
      }
    }
  };

  onSelect = (all, selected = this._selected) => {
    trigger.call(this, 'onSelect', {
      selected: [...new Set(selected)],
      all
    });
  };

  getBootstrapTableProps(props, extra) {
    const options = {
      keyField: this._keyField,
      bootstrap4: true,
      bordered: false,
      scrollable: true,
      noDataIndication: () => t('grid.no-data-indication'),
      ...props
    };

    if (Array.isArray(extra.columns)) {
      options.columns = extra.columns.map(column => {
        if (column.width) {
          column = this.setWidth(column);
        }

        if (isExistValue(column.default)) {
          column.hidden = !column.default;
        }

        const filterable = column.type === COLUMN_DATA_TYPE_DATE || column.type === COLUMN_DATA_TYPE_DATETIME ? false : props.filterable;

        column = this.setHeaderFormatter(column, filterable, props.sortable ? column.sortable : false);

        if (column.customFormatter === undefined) {
          column.formatter = this.initFormatter({ editable: props.editable, className: column.className, column });
        } else {
          column.formatter = column.customFormatter;
        }

        if (props.editable) {
          column.editable = this.checkColumnEditable.bind(null, column);
        }

        return column;
      });
    }

    if (props.editable) {
      options.cellEdit = this.setEditable(props.editable);
    } else {
      options.cellEdit = { options: {} };
    }

    options.rowEvents = {
      onMouseEnter: e => {
        const tr = e.currentTarget;

        if (props.changeTrOptionsByRowClick) {
          this.setHover(tr, ECOS_GRID_HOVERED_CLASS, false, this._tr);
        } else {
          this.getTrOptions(tr);
        }

        trigger.call(this, 'onMouseEnter', e);
      },
      onMouseLeave: e => {
        if (props.changeTrOptionsByRowClick) {
          this.setHover(e.currentTarget, ECOS_GRID_HOVERED_CLASS, true);
        }

        this._tr = null;

        trigger.call(this, 'onRowMouseLeave', e);
      },
      onClick: e => {
        props.changeTrOptionsByRowClick && this.getTrOptions(e.currentTarget);
        this.onRowClick(e.currentTarget);
      },
      onDragOver: this.onDragOver,
      onDrop: this.onDrop,
      ...extra.rowEvents
    };

    if (props.multiSelectable) {
      options.selectRow = this.createMultiSelectionCheckboxs(props);
    }

    if (props.singleSelectable) {
      options.selectRow = this.createSingleSelectionCheckboxs(props);
    }

    const CUSTOM_NESTED_DELIMITER = '|';
    const replaceDefaultNestedDelimiterForData = items => {
      if (!Array.isArray(items)) {
        return items;
      }
      return items.map(item => {
        const newItem = {};
        const fields = Object.keys(item);
        fields.forEach(field => {
          const hasDot = field.includes('.');
          if (hasDot) {
            newItem[field.replace(/\./g, CUSTOM_NESTED_DELIMITER)] = item[field];
          } else {
            newItem[field] = item[field];
          }
        });
        return newItem;
      });
    };

    const replaceDefaultNestedDelimiterForColumns = items => {
      if (!Array.isArray(items)) {
        return items;
      }
      return items.map(item => {
        if (typeof item.dataField === 'string' && item.dataField.includes('.')) {
          return {
            ...item,
            dataField: item.dataField.replace(/\./g, CUSTOM_NESTED_DELIMITER)
          };
        }
        return item;
      });
    };

    options.data = replaceDefaultNestedDelimiterForData(options.data);
    options.columns = replaceDefaultNestedDelimiterForColumns(options.columns);

    return options;
  }

  checkColumnEditable = (...data) => {
    const { editingRules } = this.props;
    const [column, , row] = data;
    const rowRules = editingRules[row.id];

    /**
     * If there is an editing rule for the entire row
     */
    if (typeof rowRules === 'boolean') {
      return !!rowRules;
    }

    /**
     * Validating a rule for a single cell
     */
    if (typeof rowRules === 'object') {
      return !!get(rowRules, column.dataField);
    }

    /**
     * Editing by default is prohibited.
     */
    return false;
  };

  setHover = (tr = null, className, needRemove, nonHoveredTr) => {
    if (!tr) {
      return;
    }

    const trClassList = tr.classList;
    const checkboxGridTrClassList = this.getCheckboxGridTrClassList(tr);

    if (needRemove) {
      checkboxGridTrClassList && checkboxGridTrClassList.remove(className);
      trClassList.remove(className);
    } else if (!nonHoveredTr || nonHoveredTr.rowIndex !== tr.rowIndex) {
      checkboxGridTrClassList && checkboxGridTrClassList.add(className);
      trClassList.add(className);
    }
  };

  getCheckboxGridTrClassList = tr => {
    const rowIndex = tr.rowIndex;
    const parent = closest(tr, REACT_BOOTSTRAP_TABLE_CLASS);
    let node;
    let classList = null;

    if (
      parent &&
      parent.nextSibling &&
      parent.nextSibling.getElementsByTagName('tr') &&
      parent.nextSibling.getElementsByTagName('tr').item(rowIndex) &&
      (node = parent.nextSibling
        .getElementsByTagName('tr')
        .item(rowIndex)
        .getElementsByClassName('ecos-grid__checkbox')[0])
    ) {
      classList = node.classList;
    }

    return classList;
  };

  getTrOptions = tr => {
    const { selectorContainer, data } = this.props;
    const row = data[tr.rowIndex - 1];
    const elGrid = tr.closest('.ecos-grid');
    const elContainer = tr.closest(selectorContainer);
    const { scrollLeft = 0 } = this._scrollValues;

    const style = {
      height: tr.offsetHeight,
      top: tr.offsetTop,
      left: scrollLeft
    };

    if (elContainer && !isInViewport(elGrid)) {
      const elSidebar = document.querySelector('.ecos-sidebar');
      const rectGrid = elGrid.getBoundingClientRect();

      style.width = elContainer.clientWidth - rectGrid.left + elSidebar.clientWidth;
    }

    this._tr = tr;

    trigger.call(this, 'onChangeTrOptions', { row, ...style });
  };

  setEditable = () => {
    return cellEditFactory({
      mode: 'dbclick',
      blurToSave: true,
      afterSaveCell: this.onEdit
    });
  };

  initFormatter = ({ editable, className, column }) => {
    return (cell, row, rowIndex, formatExtraData = {}) => {
      const { newFormatter = {} } = column;
      const { error } = row;
      const Formatter = formatExtraData.formatter;

      let content = cell;
      if (!isEmpty(newFormatter) && newFormatter.type) {
        content = FormatterService.format({ cell, row, rowIndex, column }, newFormatter);
      } else if (Formatter) {
        content = <Formatter row={row} cell={cell} rowIndex={rowIndex} {...formatExtraData} />;
      }

      return (
        <ErrorCell data={cell}>
          <div
            className={classNames('ecos-grid__td', {
              'ecos-grid__td_editable': editable,
              'ecos-grid__td_error': error && row[error] === cell,
              [className]: !!className
            })}
          >
            {content}
          </div>
        </ErrorCell>
      );
    };
  };

  setWidth = column => {
    column.style = {
      ...column.style,
      width: column.width
    };

    return column;
  };

  setHeaderFormatter = (column, filterable, sortable) => {
    const { filters, sortBy, onSort, onFilter } = this.props;
    const isFilterable = get(column, 'searchableByText') !== false && filterable && typeof onFilter === 'function';
    const isSortable = sortable && typeof onSort === 'function';

    column.headerFormatter = (column, colIndex) => {
      const filterValue = ((filters || []).filter(filter => filter.att === column.dataField)[0] || {}).val || '';
      const ascending = ((sortBy || []).filter(sort => sort.attribute === column.dataField)[0] || {}).ascending;

      return (
        <HeaderFormatter
          filterable={isFilterable}
          closeFilterEvent={CLOSE_FILTER_EVENT}
          filterValue={filterValue}
          onFilter={this.onFilter}
          sortable={isSortable}
          onSort={this.onSort}
          ascending={ascending}
          column={column}
          colIndex={colIndex}
          onDividerMouseDown={this.getStartDividerPosition}
        />
      );
    };

    return column;
  };

  createSingleSelectionCheckboxs(props) {
    this._selected = props.selected || [];

    return {
      mode: 'radio',
      classes: 'ecos-grid__tr_selected',
      selected: this._selected,
      nonSelectable: props.nonSelectable || [],
      onSelect: row => {
        const selected = this._selected[0];
        const keyValue = row[this._keyField];

        this._selected = selected !== keyValue ? [keyValue] : [];
        this.onSelect(false);
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => SelectorHeader({ indeterminate, ...rest }),
      selectionRenderer: ({ mode, ...rest }) => Selector({ mode, ...rest })
    };
  }

  createMultiSelectionCheckboxs(props) {
    this._selected = props.selectAll ? props.data.map(row => row[this._keyField]) : props.selected || [];

    if (!isEmpty(props.data) && !isEmpty(this._selected) && props.data.length === this._selected.length) {
      this.#isAllSelected = true;
    }

    return {
      mode: 'checkbox',
      classes: 'ecos-grid__tr_selected',
      selected: this._selected,
      nonSelectable: props.nonSelectable || [],
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyValue = row[this._keyField];

        this._selected = isSelect ? [...selected, keyValue] : selected.filter(x => x !== keyValue);

        if (!isSelect) {
          this.#isAllSelected = false;
        }

        if (!isEmpty(this._selected) && this._selected.length === this.props.data.length) {
          this.#isAllSelected = true;
        }

        this.onSelect(false);
      },
      onSelectAll: (isSelect, rows) => {
        const { nonSelectable, data } = this.props;

        if (!isSelect && !isEmpty(nonSelectable) && isEqual(this._selected, nonSelectable)) {
          this._selected = data.map(row => row[this._keyField]);
          this.#isAllSelected = true;
          this.onSelect(true);

          return;
        }

        if (!isSelect && !this.#isAllSelected) {
          rows = data;
        }

        this.#isAllSelected = isSelect;
        this._selected = isSelect
          ? [...this._selected, ...rows.map(row => row[this._keyField])]
          : this.getSelectedByPage(this.props.data, false);

        this.onSelect(isSelect);
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => SelectorHeader({ indeterminate, ...rest }),
      selectionRenderer: ({ mode, ...rest }) => Selector({ mode, ...rest })
    };
  }

  toolsVisible = () => {
    return this._selected.length && this.getSelectedByPage(this.props.data, true).length;
  };

  getSelectedByPage = (records, onPage) => {
    const { nonSelectable } = this.props;

    return this._selected.filter(id => {
      if (Array.isArray(nonSelectable) && nonSelectable.includes(id)) {
        return true;
      }

      const length = records.filter(record => record[this._keyField] === id).length;

      return onPage ? length : !length;
    });
  };

  createCloseFilterEvent = () => {
    this.closeFilterEvent = document.createEvent('Event');
    this.closeFilterEvent.initEvent(CLOSE_FILTER_EVENT, true, true);
    document.addEventListener('mousedown', this.triggerCloseFilterEvent, false);
    window.addEventListener('DOMMouseScroll', this.triggerCloseFilterEvent, false);
  };

  removeCloseFilterEvent = () => {
    document.removeEventListener('mousedown', this.triggerCloseFilterEvent, false);
    window.removeEventListener('DOMMouseScroll', this.triggerCloseFilterEvent, false);
  };

  createColumnResizeEvents = () => {
    document.addEventListener('mousemove', this.resizeColumn);
    document.addEventListener('mouseup', this.clearResizingColumn);
  };

  removeColumnResizeEvents = () => {
    document.removeEventListener('mousemove', this.resizeColumn);
    document.removeEventListener('mouseup', this.clearResizingColumn);
  };

  fixAllThWidth = () => {
    if (!this._tableDom) {
      return;
    }

    const allTh = this._tableDom.querySelectorAll('th');

    if (allTh.length < 3) {
      return;
    }

    for (let i = 0; i < allTh.length - 1; i++) {
      const th = allTh[i];
      const thStyles = window.getComputedStyle(th);

      th.style['width'] = thStyles['width'];
      th.style['min-width'] = thStyles['width'];
    }
  };

  getElementPaddings = (element = null) => {
    const paddings = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    if (!element) {
      return paddings;
    }

    const elementStyles = window.getComputedStyle(element);

    paddings.left = parseInt(elementStyles.getPropertyValue('padding-left'), 10) || 0;
    paddings.right = parseInt(elementStyles.getPropertyValue('padding-right'), 10) || 0;
    paddings.top = parseInt(elementStyles.getPropertyValue('padding-top'), 10) || 0;
    paddings.bottom = parseInt(elementStyles.getPropertyValue('padding-bottom'), 10) || 0;

    return paddings;
  };

  getStartDividerPosition = options => {
    this._resizingTh = options.th;
    this._tableDom = closest(options.th, 'table');

    this.fixAllThWidth(); // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3196

    this._startResizingThOffset = this._resizingTh.offsetWidth - options.e.pageX;
    this._optionMinWidth = options.minW;
  };

  resizeColumn = e => {
    let th = this._resizingTh;

    if (th && this._tableDom) {
      let width = this._startResizingThOffset + e.pageX;

      if (width < MIN_TH_WIDTH) {
        width = MIN_TH_WIDTH; //  - left - right;
      }

      if (this._optionMinWidth && width < this._optionMinWidth) {
        width = this._optionMinWidth;
      }

      const rows = this._tableDom.rows;

      for (let i = 0; i < rows.length; i++) {
        const resizeCol = rows[i].cells[th.cellIndex];
        const lastCol = rows[i].cells[rows[i].cells.length - 1];
        const curWidth = resizeCol.style.width;

        if (!resizeCol) {
          continue;
        }

        resizeCol.style.removeProperty('min-width');
        resizeCol.style.width = `${width}px`;

        if (lastCol) {
          lastCol.style.width = `${parseFloat(lastCol.style.width) + (parseFloat(curWidth) - width)}px`;
        }
      }
    }
  };

  clearResizingColumn = e => {
    if (this._resizingTh && this._tableDom) {
      const cells = this._tableDom.rows[0].cells;
      const columnsSizes = {};

      for (let i = 0; i < cells.length; i++) {
        if (!cells[i]) {
          continue;
        }

        const { left, right } = this.getElementPaddings(cells[i]);
        let width = parseInt(cells[i].style.width, 10) || '';

        columnsSizes[i] = { width, indents: left + right };
      }

      this.#columnsSizes = columnsSizes;
    }

    this._resizingTh = null;
  };

  triggerCloseFilterEvent = e => {
    (e.target || e).dispatchEvent(this.closeFilterEvent);
  };

  inlineTools = () => {
    const { inlineTools } = this.props;

    if (typeof inlineTools === 'function') {
      return inlineTools();
    }

    return null;
  };

  tools = selected => {
    const { tools } = this.props;

    if (typeof tools === 'function') {
      return tools(selected);
    }

    return null;
  };

  onMouseLeave = e => {
    trigger.call(this, 'onMouseLeave', e);
  };

  onMouseEnter = e => {
    trigger.call(this, 'onGridMouseEnter', e);
  };

  onRowClick = tr => {
    this.setHover(tr, ECOS_GRID_HOVERED_CLASS, true);
    trigger.call(this, 'onRowClick', this.props.data[tr.rowIndex - 1]);
  };

  onSort = e => {
    trigger.call(this, 'onSort', e);
  };

  onFilter = predicates => {
    trigger.call(this, 'onFilter', predicates);
  };

  onEdit = (oldValue, newValue, row, column) => {
    if (oldValue !== newValue) {
      trigger.call(this, 'onEdit', {
        id: row[this._keyField],
        attributes: {
          [column.attribute]: newValue
        }
      });
    }
  };

  onScrollStart = e => {
    this.triggerCloseFilterEvent(document.body);
    trigger.call(this, 'onScrollStart', e);
  };

  onScrollFrame = e => {
    this._scrollValues = e;

    if (this.fixedHeader) {
      if (this.hasCheckboxes) {
        set(this._shadowLeftNode, 'style.display', e.scrollLeft > 0 ? 'block' : 'none');
      }
      set(this._shadowHeadNode, 'style.display', e.scrollTop > 0 ? 'block' : 'none');
      set(this._firstHeaderCellNode, 'style.display', e.scrollLeft > 0 ? 'none' : 'block');
    }

    trigger.call(this, 'onScrolling', e);
  };

  onScrollStop = e => {
    trigger.call(this, 'onScrollStop', e);
  };

  onDragOver = e => {
    if (this.props.onRowDrop) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (!this.props.onDragOver) {
      return false;
    }

    trigger.call(this, 'onDragOver', e);
  };

  checkDropPermission = tr => {
    if (this.props.onCheckDropPermission && typeof this.props.onCheckDropPermission === 'function') {
      const item = this.props.data[tr.rowIndex - 1];

      if (!item) {
        return false;
      }

      const canDrop = this.props.onCheckDropPermission(item);

      if (!canDrop) {
        this.setHover(tr, ECOS_GRID_HOVERED_CLASS, false, this._tr);

        return false;
      }
    }

    return true;
  };

  onDragEnter = e => {
    const dataTypes = get(e, 'dataTransfer.types', []);

    if (!dataTypes.includes('Files')) {
      return;
    }

    const target = e.target;
    const tr = closest(target, ECOS_GRID_ROW_CLASS);

    trigger.call(this, 'onRowDragEnter', e);

    if (tr === null) {
      this.setHover(this._dragTr, ECOS_GRID_GRAG_CLASS, true, this._tr);
      this._dragTr = null;

      return;
    }

    if (tr === this._dragTr) {
      return;
    }

    if (this._dragTr) {
      this.setHover(this._dragTr, ECOS_GRID_GRAG_CLASS, true, this._tr);
    }

    if (!this.checkDropPermission(tr)) {
      return;
    }

    this.setHover(tr, ECOS_GRID_GRAG_CLASS, false, this._tr);

    this._dragTr = tr;

    e.stopPropagation();
    e.preventDefault();
    return false;
  };

  onDrop = e => {
    if (!this.props.onRowDrop) {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();

    const tr = e.currentTarget;

    this.setHover(tr, ECOS_GRID_GRAG_CLASS, true, this._tr);

    trigger.call(this, 'onRowDrop', {
      files: Array.from(e.dataTransfer.files),
      type: this.props.data[tr.rowIndex - 1]
    });
    e.dataTransfer.clearData();

    this._dragTr = null;

    return false;
  };

  scrollRefCallback = scroll => {
    this._scrollRef = scroll;
  };

  renderScrollableGrid() {
    const {
      minHeight,
      autoHeight,
      scrollAutoHide,
      tableViewClassName,
      byContentHeight,
      gridWrapperClassName,
      hTrackClassName
    } = this.props;

    let { maxHeight } = this.props;
    let scrollStyle = {};
    let scrollProps = {};

    if (byContentHeight && this._scrollRef) {
      maxHeight = this._scrollRef.getScrollHeight();
    }

    if (autoHeight) {
      scrollProps = { ...scrollProps, autoHeight, autoHeightMax: maxHeight, autoHeightMin: minHeight };
    } else {
      scrollStyle = { ...scrollStyle, height: minHeight || '100%' };
    }

    return (
      <Scrollbars
        ref={this.scrollRefCallback}
        onScrollStart={this.onScrollStart}
        onScrollFrame={this.onScrollFrame}
        onScrollStop={this.onScrollStop}
        style={scrollStyle}
        autoHide={scrollAutoHide}
        hideTracksWhenNotNeeded
        className={gridWrapperClassName}
        renderView={props => <div {...props} className={tableViewClassName} />}
        renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
        renderTrackHorizontal={props => (
          <div
            {...props}
            className={classNames('ecos-grid__h-scroll', hTrackClassName, {
              'ecos-grid__h-scroll_higher': minHeight > maxHeight
            })}
          />
        )}
        {...scrollProps}
      >
        {this.renderGrid()}
      </Scrollbars>
    );
  }

  renderGrid() {
    const props = omit(this.props, [
      'minHeight',
      'autoHeight',
      'scrollAutoHide',
      'className',
      'rowClassName',
      'tableViewClassName',
      'forwardedRef',
      'noTopBorder',
      'columns',
      'rowEvents',
      'byContentHeight',
      'noHeader',
      'resizableColumns'
    ]);

    const { rowClassName, resizableColumns, ...extraProps } = pick(this.props, [
      'rowClassName',
      'resizableColumns',
      'columns',
      'rowEvents'
    ]);

    const bootProps = this.getBootstrapTableProps(props, extraProps);

    return (
      <>
        <div ref={this.setGridRef}>
          <ErrorTable>
            <BootstrapTable
              {...bootProps}
              classes="ecos-grid__table"
              headerClasses={classNames('ecos-grid__header', {
                'ecos-grid__header_columns-not-resizable': !resizableColumns
              })}
              rowClasses={classNames(ECOS_GRID_ROW_CLASS, rowClassName)}
            />
          </ErrorTable>
        </div>
        {this.inlineTools()}
      </>
    );
  }

  render() {
    const { className, noTopBorder, columns, noHeader, scrollable, selected } = this.props;

    if (isEmpty(columns)) {
      return null;
    }

    const toolsVisible = this.toolsVisible();

    return (
      <div
        ref={this._ref}
        key={this._id}
        className={classNames('ecos-grid', {
          'ecos-grid_no-header': noHeader,
          'ecos-grid_freeze': this.fixedHeader,
          'ecos-grid_checkable': this.hasCheckboxes,
          'ecos-grid_no-top-border': noTopBorder,
          [className]: !!className
        })}
        onMouseLeave={this.onMouseLeave}
        onMouseEnter={this.onMouseEnter}
      >
        {!!toolsVisible && this.tools(selected)}

        {scrollable ? this.renderScrollableGrid() : this.renderGrid()}

        {this.fixedHeader ? (
          <>
            <div className={ECOS_GRID_HEAD_SHADOW} />
            <div className={ECOS_GRID_LEFT_SHADOW} />
          </>
        ) : null}
      </div>
    );
  }
}

Grid.propTypes = {
  className: PropTypes.string,
  rowClassName: PropTypes.string,
  tableViewClassName: PropTypes.string,
  gridWrapperClassName: PropTypes.string,
  hTrackClassName: PropTypes.string,
  keyField: PropTypes.string,
  dataField: PropTypes.string,

  filterable: PropTypes.bool,
  editable: PropTypes.bool,
  multiSelectable: PropTypes.bool,
  singleSelectable: PropTypes.bool,
  freezeCheckboxes: PropTypes.bool,
  selectAll: PropTypes.bool,
  fixedHeader: PropTypes.bool,
  noHeader: PropTypes.bool,
  noTopBorder: PropTypes.bool,
  scrollable: PropTypes.bool,
  scrollAutoHide: PropTypes.bool,
  autoHeight: PropTypes.bool,
  byContentHeight: PropTypes.bool,
  sortable: PropTypes.bool,
  resizableColumns: PropTypes.bool,
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

  columns: PropTypes.array,
  data: PropTypes.array,
  filters: PropTypes.array,
  sortBy: PropTypes.array,
  selected: PropTypes.array,
  nonSelectable: PropTypes.array,
  editingRules: PropTypes.object,

  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onRowDrop: PropTypes.func,
  onDragOver: PropTypes.func,
  onRowDragEnter: PropTypes.func,
  onRowMouseLeave: PropTypes.func,
  onResizeColumn: PropTypes.func,
  onGridMouseEnter: PropTypes.func,
  onCheckDropPermission: PropTypes.func,
  onChangeTrOptions: PropTypes.func,
  onScrolling: PropTypes.func,
  inlineTools: PropTypes.func
};

Grid.defaultProps = {
  scrollable: true,
  sortable: true,
  resizableColumns: true
};

export default Grid;
