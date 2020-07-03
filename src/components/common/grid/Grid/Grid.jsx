import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { Scrollbars } from 'react-custom-scrollbars';
import set from 'lodash/set';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { closest, getId, isInViewport, t, trigger } from '../../../../helpers/util';
import Checkbox from '../../form/Checkbox/Checkbox';
import { COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME } from '../../form/SelectJournal/predicates';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';

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
    this.createColumnResizeEvents();
    this.createKeydownEvents();
    this.createDragEvents();

    const current = this._ref.current;

    if (current) {
      this._shadowHeadNode = current.getElementsByClassName(ECOS_GRID_HEAD_SHADOW)[0];
      this._shadowLeftNode = current.getElementsByClassName(ECOS_GRID_LEFT_SHADOW)[0];
      this._firstHeaderCellNode = current.querySelector(`thead > tr > th:first-child .${ECOS_GRID_CHECKBOX_DIVIDER_CLASS}`);
      this._inlineActionsNode = current.querySelector('.ecos-inline-tools-actions');

      setTimeout(this.setDefaultWidth, 400);
    }

    this.checkScrollPosition();
  }

  componentDidUpdate() {
    const grid = get(this.props, 'forwardedRef.current', null);

    if (grid) {
      this._tableDom = grid.querySelector('table');
    }

    this.setColumnsSizes();
    this.checkScrollPosition();
  }

  componentWillUnmount() {
    this.removeCloseFilterEvent();
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
    this.removeDragEvents();
  }

  get hasCheckboxes() {
    const { singleSelectable, multiSelectable } = this.props;

    return singleSelectable || multiSelectable;
  }

  get fixedHeader() {
    const { freezeCheckboxes, fixedHeader } = this.props;

    return (freezeCheckboxes && this.hasCheckboxes) || fixedHeader;
  }

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

        let { width = 0, indents = 0 } = get(this.#columnsSizes, `[${j}]`, {});

        if (!width) {
          continue;
        }

        cell.style.width = `${width}px`;

        if (cell.firstChild && cell.firstChild.style) {
          cell.firstChild.style.width = `${width - indents}px`;
        }
      }
    }
  };

  setDefaultWidth = () => {
    !this._startResizingThOffset &&
      this._ref.current &&
      this._ref.current.querySelectorAll('.ecos-grid__td').forEach(cellEl => {
        if (cellEl && cellEl.clientWidth > MAX_START_TH_WIDTH) {
          cellEl.style.width = MAX_START_TH_WIDTH + 'px';
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

  setBootstrapTableProps(props, extra) {
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

        if (column.default !== undefined) {
          column.hidden = !column.default;
        }

        const filterable = column.type === COLUMN_DATA_TYPE_DATE || column.type === COLUMN_DATA_TYPE_DATETIME ? false : props.filterable;

        column = this.setHeaderFormatter(column, filterable, column.sortable);

        if (column.customFormatter === undefined) {
          column.formatter = this.initFormatter({ editable: props.editable, className: column.className });
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
      options.cellEdit = undefined;
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
      options.selectRow = this.createMultiSelectioCheckboxs(props);
    }

    if (props.singleSelectable) {
      options.selectRow = this.createSingleSelectionCheckboxs(props);
    }

    return options;
  }

  checkColumnEditable = (...data) => {
    const { editingRules } = this.props;
    const [column, , row] = data;
    const rowRules = editingRules[row.id];
    const columnEditableStatus = get(column, 'params.editable');

    /**
     * If there are rules for editing the column
     */
    if (columnEditableStatus !== undefined) {
      return columnEditableStatus;
    }

    /**
     * If there is an editing rule for the entire row
     */
    if (typeof rowRules === 'boolean') {
      return rowRules;
    }

    /**
     * Validating a rule for a single cell
     */
    if (typeof rowRules === 'object') {
      return get(rowRules, column.dataField, false);
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

  initFormatter = ({ editable, className }) => {
    return (cell, row, rowIndex, formatExtraData) => {
      formatExtraData = formatExtraData || {};
      const Formatter = formatExtraData.formatter;
      const errorAttribute = row.error;

      return (
        <div
          className={classNames('ecos-grid__td', {
            'ecos-grid__td_editable': editable,
            'ecos-grid__td_error': errorAttribute && row[errorAttribute] === cell,
            [className]: !!className
          })}
        >
          {Formatter ? <Formatter row={row} cell={cell} rowIndex={rowIndex} {...formatExtraData} /> : cell}
        </div>
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
    const { filters, sortBy } = this.props;

    column.headerFormatter = (column, colIndex) => {
      const filterValue = ((filters || []).filter(filter => filter.att === column.dataField)[0] || {}).val || '';
      const ascending = ((sortBy || []).filter(sort => sort.attribute === column.dataField)[0] || {}).ascending;

      return (
        <HeaderFormatter
          filterable={filterable}
          closeFilterEvent={CLOSE_FILTER_EVENT}
          filterValue={filterValue}
          onFilter={this.onFilter}
          sortable={sortable}
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

        trigger.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => SelectorHeader({ indeterminate, ...rest }),
      selectionRenderer: ({ mode, ...rest }) => Selector({ mode, ...rest })
    };
  }

  createMultiSelectioCheckboxs(props) {
    this._selected = props.selectAll ? props.data.map(row => row[this._keyField]) : props.selected || [];

    return {
      mode: 'checkbox',
      classes: 'ecos-grid__tr_selected',
      selected: this._selected,
      nonSelectable: props.nonSelectable || [],
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyValue = row[this._keyField];

        this._selected = isSelect ? [...selected, keyValue] : selected.filter(x => x !== keyValue);

        trigger.call(this, 'onSelect', {
          selected: this._selected,
          all: false
        });
      },
      onSelectAll: (isSelect, rows) => {
        this._selected = isSelect
          ? [...this._selected, ...rows.map(row => row[this._keyField])]
          : this.getSelectedByPage(this.props.data, false);

        trigger.call(this, 'onSelect', {
          selected: this._selected,
          all: isSelect
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => SelectorHeader({ indeterminate, ...rest }),
      selectionRenderer: ({ mode, ...rest }) => Selector({ mode, ...rest })
    };
  }

  toolsVisible = () => {
    return this._selected.length && this.getSelectedByPage(this.props.data, true).length;
  };

  getSelectedByPage = (records, onPage) => {
    return this._selected.filter(id => {
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
      const { left, right } = this.getElementPaddings(th);
      let width = this._startResizingThOffset + e.pageX;

      if (width < MIN_TH_WIDTH) {
        width = MIN_TH_WIDTH; //  - left - right;
      }

      if (this._optionMinWidth && width < this._optionMinWidth) {
        width = this._optionMinWidth;
      }

      const rows = this._tableDom.rows;

      for (let i = 0; i < rows.length; i++) {
        let firstCol = rows[i].cells[th.cellIndex];

        if (!firstCol) {
          continue;
        }

        firstCol.style.removeProperty('min-width');
        firstCol.style.width = `${width}px`;

        if (firstCol.firstChild && firstCol.firstChild.style) {
          firstCol.firstChild.style.width = `${width - left - right}px`;
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
          [column.attribute]: column.formatExtraData.formatter.getId(newValue)
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
      const canDrop = this.props.onCheckDropPermission(this.props.data[tr.rowIndex - 1]);

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

  render() {
    const {
      minHeight,
      autoHeight,
      scrollAutoHide,
      className,
      rowClassName,
      tableViewClassName,
      forwardedRef,
      noTopBorder,
      columns,
      rowEvents,
      byContentHeight,
      ...otherProps
    } = this.props;
    const bootProps = this.setBootstrapTableProps(otherProps, { columns: cloneDeep(columns), rowEvents: cloneDeep(rowEvents) });
    const toolsVisible = this.toolsVisible();

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

    const Scroll = ({ scrollable, children, refCallback }) =>
      scrollable ? (
        <Scrollbars
          ref={refCallback}
          onScrollStart={this.onScrollStart}
          onScrollFrame={this.onScrollFrame}
          onScrollStop={this.onScrollStop}
          style={scrollStyle}
          autoHide={scrollAutoHide}
          hideTracksWhenNotNeeded
          renderView={props => <div {...props} className={tableViewClassName} />}
          renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
          renderTrackHorizontal={props => (
            <div {...props} className={classNames('ecos-grid__h-scroll', { 'ecos-grid__h-scroll_higher': minHeight > maxHeight })} />
          )}
          {...scrollProps}
        >
          {children}
        </Scrollbars>
      ) : (
        <>{children}</>
      );

    if (columns && columns.length) {
      return (
        <div
          ref={this._ref}
          key={this._id}
          className={classNames('ecos-grid', {
            'ecos-grid_freeze': this.fixedHeader,
            'ecos-grid_checkable': this.hasCheckboxes,
            'ecos-grid_no-top-border': noTopBorder,
            [className]: !!className
          })}
          onMouseLeave={this.onMouseLeave}
          onMouseEnter={this.onMouseEnter}
        >
          {!!toolsVisible && this.tools(bootProps.selected)}
          <Scroll scrollable={bootProps.scrollable} refCallback={this.scrollRefCallback}>
            <div ref={forwardedRef}>
              <BootstrapTable
                {...bootProps}
                classes="ecos-grid__table"
                headerClasses="ecos-grid__header"
                rowClasses={classNames(ECOS_GRID_ROW_CLASS, rowClassName)}
              />
            </div>
            {this.inlineTools()}
          </Scroll>
          {this.fixedHeader ? (
            <>
              <div className={ECOS_GRID_HEAD_SHADOW} />
              <div className={ECOS_GRID_LEFT_SHADOW} />
            </>
          ) : null}
        </div>
      );
    }

    return null;
  }
}

Grid.propTypes = {
  className: PropTypes.string,
  rowClassName: PropTypes.string,
  tableViewClassName: PropTypes.string,
  keyField: PropTypes.string,
  dataField: PropTypes.string,

  filterable: PropTypes.bool,
  editable: PropTypes.bool,
  multiSelectable: PropTypes.bool,
  singleSelectable: PropTypes.bool,
  freezeCheckboxes: PropTypes.bool,
  selectAll: PropTypes.bool,
  fixedHeader: PropTypes.bool,
  noTopBorder: PropTypes.bool,
  scrollable: PropTypes.bool,
  scrollAutoHide: PropTypes.bool,
  autoHeight: PropTypes.bool,
  byContentHeight: PropTypes.bool,

  columns: PropTypes.array,
  data: PropTypes.array,
  filters: PropTypes.array,
  sortBy: PropTypes.array,
  selected: PropTypes.array,
  nonSelectable: PropTypes.array,
  editingRules: PropTypes.object,

  onRowDrop: PropTypes.func,
  onDragOver: PropTypes.func,
  onRowDragEnter: PropTypes.func,
  onRowMouseLeave: PropTypes.func,
  onResizeColumn: PropTypes.func,
  onGridMouseEnter: PropTypes.func,
  onCheckDropPermission: PropTypes.func,
  onChangeTrOptions: PropTypes.func
};

Grid.defaultProps = {
  scrollable: true
};

export default Grid;
