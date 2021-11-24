import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import BootstrapTableConst from 'react-bootstrap-table-next/lib/src/const';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { Scrollbars } from 'react-custom-scrollbars';
import set from 'lodash/set';
import get from 'lodash/get';
import head from 'lodash/head';
import last from 'lodash/last';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isBoolean from 'lodash/isBoolean';
import isObject from 'lodash/isObject';
import isElement from 'lodash/isElement';

import { getId, isInViewport, t, trigger } from '../../../../helpers/util';
import FormatterService from '../../../Journals/service/formatters/FormatterService';
import { COMPLEX_FILTER_LIMIT } from '../../../Journals/constants';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';
import { SELECTOR_MENU_KEY } from '../util';
import ErrorCell from '../ErrorCell';
import ErrorTable from '../ErrorTable';
import SelectorHeader from './SelectorHeader';
import Selector from './Selector';

import './Grid.scss';

const CUSTOM_NESTED_DELIMITER = '|';
const ECOS_GRID_HOVERED_CLASS = 'ecos-grid_hovered';
const ECOS_GRID_GRAG_CLASS = 'ecos-grid_drag';
const ECOS_GRID_ROW_CLASS = 'ecos-grid__row';
const ECOS_GRID_HEAD_SHADOW = 'ecos-grid__head-shadow';
const ECOS_GRID_LEFT_SHADOW = 'ecos-grid__left-shadow';

const MAX_START_TH_WIDTH = 500;

const cssNum = v => `${v}px`;

class Grid extends Component {
  #columnsSizes = {};
  #gridRef = null;

  constructor(props) {
    super(props);

    this._id = getId();
    this._resizingTh = null;
    this._startResizingThOffset = 0;
    this._scrollValues = {};
    this._tr = null;
    this._dragTr = null;
    this._tableDom = null;
    this._ref = React.createRef();
    this._scrollRef = null;
    this._shadowHeadNode = null;
    this._shadowLeftNode = null;
    this._firstHeaderCellNode = null;
    this._optionMinWidth = null;

    this.state = {
      needCellUpdate: false,
      tableHeight: 0,
      isScrolling: false,
      selected: props.selected || []
    };
  }

  get hasCheckboxes() {
    const { singleSelectable, multiSelectable } = this.props;

    return singleSelectable || multiSelectable;
  }

  get fixedHeader() {
    const { freezeCheckboxes, fixedHeader } = this.props;

    return (freezeCheckboxes && this.hasCheckboxes) || fixedHeader;
  }

  static getDerivedStateFromProps(props, state) {
    if (!isEqual(props.selected, state.selected)) {
      return { selected: props.selected };
    }

    return null;
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !nextState.isScrolling;
  }

  componentDidMount() {
    this.createKeydownEvents();
    this.createDragEvents();

    const current = this._ref.current;

    if (current) {
      this._shadowHeadNode = head(current.getElementsByClassName(ECOS_GRID_HEAD_SHADOW));
      this._shadowLeftNode = head(current.getElementsByClassName(ECOS_GRID_LEFT_SHADOW));
      this._firstHeaderCellNode = current.querySelector('thead > tr > th:first-child .ecos-grid__checkbox-divider');
      this._timeoutDefaultWidth = setTimeout(this.setDefaultWidth, 1);
    }

    this.checkScrollPosition();

    if (this.props.resizableColumns) {
      this.createColumnResizeEvents();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { resizableColumns, columns } = this.props;

    if (this.#gridRef) {
      this._tableDom = this.#gridRef.querySelector('table');
    }

    if (prevProps.resizableColumns !== resizableColumns) {
      resizableColumns ? this.createColumnResizeEvents() : this.removeColumnResizeEvents();
    }

    if (!isEqual(prevProps.columns.map(i => i.id), columns.map(i => i.id))) {
      this.setState({ needCellUpdate: true }, () => this.setState({ needCellUpdate: false }));
    }

    this.setColumnsSizes();
    this.checkScrollPosition();
  }

  componentWillUnmount() {
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
    this.removeDragEvents();
    clearTimeout(this._timeoutDefaultWidth);
  }

  setGridRef = ref => {
    if (!ref) {
      return;
    }

    const { forwardedRef } = this.props;

    if (isFunction(forwardedRef)) {
      forwardedRef(ref);
    }

    this.#gridRef = ref;
  };

  setColumnsSizes = () => {
    if (!this._tableDom || !Object.keys(this.#columnsSizes).length) {
      return;
    }

    const tHead = head(this._tableDom.rows);

    tHead &&
      tHead.cells.forEach((cell, i) => {
        const width = cell && !!get(this.#columnsSizes, [i, 'width']);
        width && (cell.style.width = cssNum(width));
      });
  };

  setDefaultWidth = () => {
    if (!this._startResizingThOffset && this._ref.current) {
      const table = this._ref.current.querySelector('.react-bootstrap-table > table');
      const thCells = table && head(table.rows).cells;

      if (!isEmpty(thCells)) {
        const checkbox = table.querySelector('.ecos-grid__checkbox');
        const cellLen = thCells.length - (checkbox ? 1 : 0);
        const proratedSizeCell = (table.parentElement.clientWidth - (checkbox ? checkbox.clientWidth : 0)) / cellLen;
        const clearedSizeCell = Math.floor(proratedSizeCell / 10) * 10;
        const max = Math.max(clearedSizeCell, MAX_START_TH_WIDTH);

        if (cellLen > 1 && table.clientWidth > table.parentElement.clientWidth) {
          thCells.forEach(cell => cell.clientWidth > max && (cell.style.width = cssNum(max)));
        }
      }
    }
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

  onSelect = ({ allPage, newSelected, allPossible, newExcluded }) => {
    const { onSelect } = this.props;
    const selected = [...new Set(newSelected)];
    const excluded = [...new Set(newExcluded)];
    const props = { selected };

    !isNil(allPage) && (props.all = allPage);
    !isNil(allPossible) && (props.allPossible = allPossible);
    !isNil(newExcluded) && (props.excluded = excluded);

    this.setState({ selected }, () => isFunction(onSelect) && onSelect(props));
  };

  getBootstrapTableProps(props, extra) {
    const { needCellUpdate } = this.state;
    const options = {
      keyField: props.keyField,
      bootstrap4: true,
      bordered: false,
      scrollable: true,
      noDataIndication: () => t('grid.no-data-indication'),
      ...props
    };

    if (Array.isArray(extra.columns)) {
      options.columns = extra.columns.map(column => {
        if (column.width) {
          set(column, 'headerStyle.width', column.width);
          get(column, 'style.width') && delete column.style.width;
        }

        if (!isUndefined(column.default)) {
          column.hidden = !column.default;
        }

        const filterable = props.filterable;

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
        if (this.state.isScrolling) {
          return;
        }

        const tr = e.currentTarget;

        if (props.changeTrOptionsByRowClick) {
          this.setHover(tr, ECOS_GRID_HOVERED_CLASS, false, this._tr);
        } else {
          this.getTrOptions(tr);
        }

        trigger.call(this, 'onMouseEnter', e);
      },
      onMouseLeave: e => {
        if (this.state.isScrolling) {
          return;
        }

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
      onDoubleClick: this.onDoubleClick,
      onDragOver: this.onDragOver,
      onDrop: this.onDrop,
      ...extra.rowEvents
    };

    if (props.multiSelectable) {
      options.selectRow = this.createMultiSelectionCheckboxes(props);
    }

    if (props.singleSelectable) {
      options.selectRow = this.createSingleSelectionCheckboxes(props);
    }

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

        // Cause: https://citeck.atlassian.net/browse/ECOSUI-1519
        if (needCellUpdate) {
          newItem._needUpdateCell = true;
        } else {
          delete newItem._needUpdateCell;
        }

        return newItem;
      });
    };

    const replaceDefaultNestedDelimiterForColumns = items => {
      if (!Array.isArray(items)) {
        return items;
      }
      return items.map(item => {
        if (isString(item.dataField) && item.dataField.includes('.')) {
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
    if (isBoolean(rowRules)) {
      return !!rowRules;
    }

    /**
     * Validating a rule for a single cell
     */
    if (isObject(rowRules)) {
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
    const index = tr.rowIndex;
    const parent = isElement(tr) && tr.closest('.react-bootstrap-table');
    const foundTr = isFunction(get(parent, 'nextSibling.getElementsByTagName')) && parent.nextSibling.getElementsByTagName('tr');
    const node = get(foundTr, [index]) && head(foundTr[index].getElementsByClassName('ecos-grid__checkbox'));

    return get(node, 'classList', null);
  };

  getTrOptions = tr => {
    const { selectorContainer, data } = this.props;
    const { isScrolling } = this.state;
    const row = data[tr.rowIndex - 1];
    const elGrid = tr.closest('.ecos-grid');
    const elContainer = tr.closest(selectorContainer);
    const { scrollLeft = 0 } = this._scrollValues;

    const style = {
      height: tr.offsetHeight + 2,
      top: tr.offsetTop - 1,
      right: -scrollLeft
    };

    if (elContainer && !isInViewport(elGrid)) {
      const elSidebar = document.querySelector('.ecos-sidebar');
      const rectGrid = elGrid.getBoundingClientRect();

      style.width = elContainer.clientWidth - rectGrid.left + elSidebar.clientWidth;
    }

    this._tr = tr;

    if (!isScrolling) {
      trigger.call(this, 'onChangeTrOptions', { row, ...style });
    }
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

  setHeaderFormatter = (column, filterable, sortable) => {
    const { filters, sortBy, onSort, onFilter, onOpenSettings, originPredicates } = this.props;
    const isFilterable = filterable && column.searchable && column.searchableByText && isFunction(onFilter);
    const isSortable = sortable && isFunction(onSort);

    column.headerFormatter = (column, colIndex) => {
      const filterPredicates = (filters || []).filter(filter => filter.att === column.dataField) || [];
      const filterPredicate = head(filterPredicates) || {};
      const filterValue = filterPredicate.val || '';
      const sort = find(sortBy, sort => sort.attribute === column.dataField) || {};
      const ascending = sort.ascending;
      const originPredicate = find(originPredicates, predicate => predicate.att === column.dataField) || {};

      return (
        <HeaderFormatter
          originPredicate={originPredicate}
          isComplexFilter={filterPredicates.length > COMPLEX_FILTER_LIMIT}
          predicate={filterPredicate}
          filterable={isFilterable}
          filterValue={filterValue}
          onFilter={this.onFilter}
          sortable={isSortable}
          onSort={this.onSort}
          ascending={ascending}
          column={column}
          colIndex={colIndex}
          onDividerMouseDown={this.getStartDividerPosition}
          onOpenSettings={onOpenSettings}
        />
      );
    };

    return column;
  };

  createSingleSelectionCheckboxes(props) {
    const { selected } = this.state;

    return {
      mode: BootstrapTableConst.ROW_SELECT_SINGLE,
      classes: 'ecos-grid__tr_selected',
      selected,
      nonSelectable: props.nonSelectable || [],
      onSelect: this.handleSelectRadio,
      selectionHeaderRenderer: props => <SelectorHeader {...props} />,
      selectionRenderer: props => <Selector {...props} />
    };
  }

  handleSelectRadio = row => {
    const prevValue = head(this.state.selected);
    const newValue = row[this.props.keyField];
    const newSelected = newValue !== prevValue ? [newValue] : [];

    this.onSelect({ allPage: false, newSelected });
  };

  createMultiSelectionCheckboxes(props) {
    const selected = props.selectAll ? this.getSelectedPageItems() : this.state.selected || [];

    return {
      mode: BootstrapTableConst.ROW_SELECT_MULTIPLE,
      classes: 'ecos-grid__tr_selected',
      selected,
      nonSelectable: props.nonSelectable || [],
      onSelect: this.handleSelectCheckbox,
      onSelectAll: this.handleSelectAllCheckbox,
      selectionHeaderRenderer: props => <SelectorHeader {...props} hasMenu onClickMenu={this.handleClickMenuCheckbox} />,
      selectionRenderer: props => <Selector {...props} />
    };
  }

  handleSelectCheckbox = (row, isSelect) => {
    const { keyField, excluded } = this.props;
    const { selected } = this.state;
    const keyValue = row[keyField];
    const newSelected = isSelect ? [...selected, keyValue] : selected.filter(x => x !== keyValue);
    const newExcluded = isSelect ? excluded.filter(x => x !== keyValue) : [...excluded, keyValue];

    this.onSelect({ allPage: false, newSelected, newExcluded });
  };

  handleSelectAllCheckbox = (allPage, rows) => {
    const { selected } = this.state;
    const page = this.getSelectedPageItems();
    const ids = rows.map(row => row.id);
    const isSelectedPage = allPage || (!allPage && rows.length < page.length);
    const newSelected = isSelectedPage ? [...selected, ...page] : selected.filter(item => !ids.includes(item));

    this.onSelect({ allPage, newSelected, newExcluded: [] });
  };

  handleClickMenuCheckbox = option => {
    const newSelected = option.id === SELECTOR_MENU_KEY.NONE ? [] : this.getSelectedPageItems();
    const allPage = option.id !== SELECTOR_MENU_KEY.NONE;
    const allPossible = option.id === SELECTOR_MENU_KEY.ALL;

    this.onSelect({ allPage, newSelected, allPossible, newExcluded: [] });
  };

  toolsVisible = () => {
    return !isEmpty(this.getSelectedByPage(this.props.data, true));
  };

  getSelectedPageItems = () => {
    const { nonSelectable, keyField, data = [] } = this.props;

    return data.filter(item => Array.isArray(nonSelectable) && !nonSelectable.includes(item[keyField])).map(item => item[keyField]);
  };

  getSelectedByPage = (records, onPage) => {
    const { nonSelectable, keyField } = this.props;
    const { selected } = this.state;

    return selected.filter(id => {
      if (Array.isArray(nonSelectable) && nonSelectable.includes(id)) {
        return false;
      }

      const found = find(records, record => record[keyField] === id);

      return onPage && found;
    });
  };

  createColumnResizeEvents = () => {
    document.addEventListener('mousemove', this.resizeColumn);
    document.addEventListener('mouseup', this.clearResizingColumn);
  };

  removeColumnResizeEvents = () => {
    document.removeEventListener('mousemove', this.resizeColumn);
    document.removeEventListener('mouseup', this.clearResizingColumn);
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
    this._tableDom = isElement(options.th) ? options.th.closest('table') : null;
    this._startResizingThOffset = this._resizingTh.offsetWidth - options.e.pageX;
  };

  resizeColumn = e => {
    const th = this._resizingTh;

    if (th && this._tableDom) {
      const width = this._startResizingThOffset + e.pageX;
      const tHead = head(this._tableDom.rows);

      if (isElement(tHead)) {
        const cells = tHead.cells;
        const resizeCol = get(cells, [th.cellIndex]);
        const lastCol = last(cells);
        const resizeWidth = resizeCol.style.width;
        const lastWidth = lastCol.style.width;

        resizeCol.style.removeProperty('min-width');
        resizeCol.style.width = cssNum(width);

        if (isElement(lastCol)) {
          lastCol.style.width = cssNum(parseFloat(lastWidth) + (parseFloat(resizeWidth) - width));
        }
      }
    }
  };

  clearResizingColumn = e => {
    if (this._resizingTh && this._tableDom) {
      const cells = head(this._tableDom.rows).cells;
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

  inlineTools = () => {
    const { inlineTools } = this.props;

    return isFunction(inlineTools) ? inlineTools() : null;
  };

  tools = selected => {
    const { tools } = this.props;

    isFunction(tools) && tools(selected);

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

  onDoubleClick = (...params) => {
    this.props.onRowDoubleClick && this.props.onRowDoubleClick(params);
  };

  onSort = e => {
    trigger.call(this, 'onSort', e);
  };

  onFilter = (predicates, type) => {
    const { onFilter } = this.props;
    isFunction(onFilter) && onFilter(predicates, type);
  };

  onEdit = (oldValue, newValue, row, column) => {
    if (oldValue !== newValue) {
      trigger.call(this, 'onEdit', {
        id: row[this.props.keyField],
        attributes: {
          [column.attribute]: newValue
        }
      });
    }
  };

  onScrollStart = e => {
    this.setState({ isScrolling: true });
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
    this.setState({ isScrolling: false });

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
    if (isFunction(this.props.onCheckDropPermission)) {
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
    const tr = isElement(target) ? target.closest(`.${ECOS_GRID_ROW_CLASS}`) : null;

    trigger.call(this, 'onRowDragEnter', e);

    if (isNil(tr)) {
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
    const bootProps = this.getBootstrapTableProps(props, cloneDeep(extraProps));

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
    const { className, noTopBorder, columns, noHeader, scrollable, selected, multiSelectable } = this.props;

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
          'ecos-grid_selectable': this.hasCheckboxes,
          'ecos-grid_selectable_multi': multiSelectable,
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
  originPredicates: PropTypes.array,
  sortBy: PropTypes.array,
  selected: PropTypes.array,
  excluded: PropTypes.array,
  nonSelectable: PropTypes.array,
  editingRules: PropTypes.object,

  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onRowClick: PropTypes.func,
  onRowDoubleClick: PropTypes.func,
  onRowDrop: PropTypes.func,
  onDragOver: PropTypes.func,
  onRowDragEnter: PropTypes.func,
  onRowMouseLeave: PropTypes.func,
  onResizeColumn: PropTypes.func,
  onGridMouseEnter: PropTypes.func,
  onCheckDropPermission: PropTypes.func,
  onChangeTrOptions: PropTypes.func,
  onScrolling: PropTypes.func,
  onOpenSettings: PropTypes.func,
  inlineTools: PropTypes.func
};

Grid.defaultProps = {
  scrollable: true,
  sortable: true,
  resizableColumns: true,
  nonSelectable: [],
  selected: [],
  excluded: [],
  keyField: 'id'
};

export default Grid;
