import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import get from 'lodash/get';
import head from 'lodash/head';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isElement from 'lodash/isElement';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import isNumber from 'lodash/isNumber';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import last from 'lodash/last';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import set from 'lodash/set';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import BootstrapTableConst from 'react-bootstrap-table-next/lib/src/const';
import cellEditFactory from 'react-bootstrap-table2-editor';
import { Scrollbars } from 'react-custom-scrollbars';
import { createRoot } from 'react-dom/client';
import { Tooltip } from 'reactstrap';

import ClickOutside from '../../../ClickOutside';
import { COMPLEX_FILTER_LIMIT, ECOS_GRID_PADDING_HORIZONTAL, JOURNAL_MIN_HEIGHT } from '../../../Journals/constants';
import FormatterService from '../../../Journals/service/formatters/FormatterService';
import DateFormatter from '../../../Journals/service/formatters/registry/DateFormatter';
import DateTimeFormatter from '../../../Journals/service/formatters/registry/DateTimeFormatter';
import Loader from '../../../common/Loader';
import EcosProgressLoading from '../../EcosProgressLoading';
import EcosTooltip from '../../Tooltip';
import Button from '../../btns/Btn';
import Icon from '../../icons/Icon';
import NoData from '../../icons/NoData';
import ErrorCell from '../ErrorCell';
import ErrorTable from '../ErrorTable';
import HeaderFormatter from '../formatters/header/HeaderFormatter/HeaderFormatter';
import { SELECTOR_MENU_KEY } from '../util';

import Selector from './Selector';
import SelectorHeader from './SelectorHeader';

import { pagesStore } from '@/helpers/indexedDB';
import { getId, t, getCurrentUserName } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';
import pageTabList from '@/services/pageTabs/PageTabList';

import './Grid.scss';
import '../../Tooltip/style.scss';

const CUSTOM_NESTED_DELIMITER = '|';
const ECOS_JOURNAL_CLASS = 'ecos-journal';
const ECOS_GRID_HOVERED_CLASS = 'ecos-grid_hovered';
const ECOS_GRID_GRAG_CLASS = 'ecos-grid_drag';
const ECOS_GRID_ROW_CLASS = 'ecos-grid__row';
const HAS_INLINE_TOOLS_CLASS = 'has-inline-tools';
const ECOS_GRID_HEADER = 'ecos-grid__header';
const ECOS_GRID_HEADER_LOADER = 'ecos-grid__header-loader';
const ECOS_GRID_HEAD_SHADOW = 'ecos-grid__head-shadow';
const ECOS_GRID_LEFT_SHADOW = 'ecos-grid__left-shadow';
const ECOS_GRID_INLINE_TOOLS_CONTAINER = 'ecos-grid__inline-tools-container';
const REACT_BOOTSTRAP_TABLE = 'react-bootstrap-table';

const HEIGHT_TABLE_ROW_IN_WIDGET = 38;

const cssNum = v => `${v}px`;

class Grid extends Component {
  #columnsSizes = {};
  #gridRef = null;
  #pageId = null;

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
      hasFooter: false,
      tableHeight: 0,
      isScrolling: false,
      maxHeight: props.maxHeight,
      selected: props.selected || [],
      selectedRowId: null,
      updatedColumn: null,
      updatedColumnBlocked: null,
      ecosGridWidth: 0
    };

    this.userName = getCurrentUserName();
  }

  get hasCheckboxes() {
    const { singleSelectable, multiSelectable } = this.props;

    return singleSelectable || multiSelectable;
  }

  get fixedHeader() {
    const { freezeCheckboxes, fixedHeader } = this.props;

    return (freezeCheckboxes && this.hasCheckboxes) || fixedHeader;
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !nextState.isScrolling || (nextProps.isViewNewJournal && !(nextProps.data && nextProps.data.length)) || false;
  }

  componentDidMount() {
    this.#pageId = pageTabList.activeTabId;

    this.createKeydownEvents();
    this.createDragEvents();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          this.setState({ ecosGridWidth: width });
        }
      });
    } else {
      this.resizeObserver = null;
    }

    const current = this._ref.current;

    if (current) {
      this._shadowHeadNode = head(current.getElementsByClassName(ECOS_GRID_HEAD_SHADOW));
      this._shadowLeftNode = head(current.getElementsByClassName(ECOS_GRID_LEFT_SHADOW));
      this._firstHeaderCellNode = current.querySelector('thead > tr > th:first-child .ecos-grid__checkbox-divider');
      if (this.resizeObserver) {
        this.resizeObserver.observe(current);
      }
    }

    this.checkScrollPosition();

    if (this.props.resizableColumns) {
      this.createColumnResizeEvents();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { byContentHeight, resizableColumns, columns, selected, isResetSettings, loading, isViewNewJournal } = this.props;
    const { maxHeight } = this.state;
    const current = this._ref.current;

    if (this.#gridRef) {
      this._tableDom = this.#gridRef.querySelector('table');
    }

    if (!isEqual(selected, this.state.selected)) {
      this.setState({ selected });
    }

    if (prevProps.resizableColumns !== resizableColumns) {
      resizableColumns ? this.createColumnResizeEvents() : this.removeColumnResizeEvents();
    }

    if (
      !isEqual(
        prevProps.columns.map(i => i.id),
        columns.map(i => i.id)
      )
    ) {
      this.setState({ needCellUpdate: true }, () => this.setState({ needCellUpdate: false }));
    }

    if (!prevProps.isResetSettings && isResetSettings) {
      this.#columnsSizes = {};
      this.setState({ selected: [] });
    }

    if (isViewNewJournal && maxHeight !== this.props.maxHeight) {
      this.setState({ maxHeight: this.props.maxHeight });
    }

    if (!isViewNewJournal && byContentHeight && this._scrollRef && isEqual(pageTabList.activeTabId, this.#pageId)) {
      const newMaxHeight = this._scrollRef.getScrollHeight();
      if (maxHeight !== newMaxHeight) {
        this.setState({ maxHeight: newMaxHeight });
      }
    }

    if (current) {
      if (prevProps.loading !== loading) {
        this.updateInlineToolsElementOfLoading();
      }

      const headerElement = current.querySelector(`.${ECOS_GRID_HEADER}`);
      const headerLoaderElement = current.querySelector(`.${ECOS_GRID_HEADER_LOADER}`);

      let root = null;

      if (headerElement && !headerLoaderElement && loading) {
        const theadElement = headerElement.closest('thead');

        if (theadElement) {
          const loaderDiv = document.createElement('tr');
          loaderDiv.classList.add(ECOS_GRID_HEADER_LOADER);

          theadElement.appendChild(loaderDiv);

          root = createRoot(loaderDiv);
          root.render(<EcosProgressLoading />);
        }
      } else if (headerLoaderElement && !loading) {
        root?.unmount();
        headerLoaderElement.remove();
      }
    }

    this.setColumnsSizes();
    this.checkScrollPosition();
  }

  componentWillUnmount() {
    this.removeColumnResizeEvents();
    this.removeKeydownEvents();
    this.removeDragEvents();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
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
      Array.from(tHead.cells).forEach((cell, i) => {
        const width = cell && !!get(this.#columnsSizes, [i, 'width']);
        width && (cell.style.width = cssNum(get(this.#columnsSizes, [i, 'width'])));
      });
  };

  checkScrollPosition() {
    const { isScrolling } = this.state;

    if (isScrolling) {
      return;
    }

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

  clearSelectedState = () => {
    this.setState({ selected: [] });
  };

  onSelect = ({ allPage, newSelected, allPossible, newExcluded }) => {
    const { onSelect, nonSelectable = [], selected: oldSelected } = this.props;
    const selectedAndDisabled = oldSelected.filter(item => nonSelectable.includes(item));
    const selected = [...new Set([...newSelected, ...selectedAndDisabled])];
    const excluded = [...new Set(newExcluded)];
    const props = { selected };

    !isNil(allPage) && (props.all = allPage);
    !isNil(allPossible) && (props.allPossible = allPossible);
    !isNil(newExcluded) && (props.excluded = excluded);

    this.setState({ selected }, () => isFunction(onSelect) && onSelect(props));
  };

  getBootstrapTableProps(props, extra) {
    const { isViewNewJournal, data, maxHeight } = this.props;
    const { needCellUpdate, isScrolling } = this.state;
    const { scrollLeft = 0 } = this._scrollRef ? this._scrollRef.getValues() || {} : {};

    let noDataIndication = null;

    const tableEl = this._ref.current
      ? this._ref.current.querySelector(`.${REACT_BOOTSTRAP_TABLE}`)
      : document.querySelector(`.${REACT_BOOTSTRAP_TABLE}`);

    const isWidget = tableEl && !tableEl.closest(`.${ECOS_JOURNAL_CLASS}`);

    if (tableEl && isViewNewJournal && !(data && data.length) && !isWidget) {
      const theadElement = tableEl.querySelector('thead');
      const width = tableEl.clientWidth;

      noDataIndication = (
        <div
          className="ecos-grid__no-data"
          style={{
            position: isScrolling ? 'fixed' : 'absolute',
            width: width ? width - ECOS_GRID_PADDING_HORIZONTAL * 2 : `calc(100% - ${cssNum(ECOS_GRID_PADDING_HORIZONTAL * 2)})`,
            ...(!isScrolling && scrollLeft && { left: scrollLeft + ECOS_GRID_PADDING_HORIZONTAL }),
            ...(theadElement && { minHeight: maxHeight - theadElement.clientHeight - 70 })
          }}
        >
          <NoData />
          <div className="ecos-grid__no-data_info">
            <h3 className="ecos-grid__no-data_info-head">{t('comp.no-data.head')}</h3>
            <span className="ecos-grid__no-data_info-description">{t('comp.no-data.indication')}</span>
          </div>
        </div>
      );
    } else if (!isViewNewJournal || isWidget) {
      noDataIndication = t('comp.no-data.indication');
    }

    const options = {
      keyField: props.keyField,
      bootstrap4: true,
      bordered: false,
      scrollable: true,
      noDataIndication: () => noDataIndication,
      ...props
    };

    if (Array.isArray(extra.columns)) {
      options.columns = extra.columns.map((column, indexCol) => {
        let width = column.width;

        if (indexCol + 1 === extra.columns.length && this.isNotSavingSetting) {
          column.width = null;
          width = null;
        } else if (width && extra.columns.length > 1) {
          set(column, 'headerStyle.width', width);
          get(column, 'style.width') && delete column.style.width;
        }

        if (!isUndefined(column.default) && !column.hidden) {
          column.hidden = !column.default;
        }

        const filterable = props.filterable;

        column = this.setHeaderFormatter(column, filterable, props.sortable ? column.sortable : false, width);

        if (column.customFormatter === undefined) {
          column.formatter = this.initFormatter({
            editable: props.editable,
            className: column.className,
            column,
            isViewNewJournal: props.isViewNewJournal,
            isBlockNewJournalFormatter: props.isBlockNewJournalFormatter || false
          });
          column.footerFormatter = this.initFooterFormatter(column.name || column.attribute);
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
        let settingInlineTools = {};

        if (props.changeTrOptionsByRowClick) {
          this.setHover(tr, ECOS_GRID_HOVERED_CLASS, false, this._tr);
        } else {
          settingInlineTools = this.getTrOptions(tr);
        }

        const { onMouseEnter } = props;
        isFunction(onMouseEnter) && onMouseEnter(e);

        const hasInlineToolsElement = !!tr.querySelector(`.${ECOS_GRID_INLINE_TOOLS_CONTAINER}`);

        if (hasInlineToolsElement) {
          return;
        }

        this.appendInlineToolsElement(tr, settingInlineTools);
      },
      onMouseLeave: e => {
        const relatedTarget = e.relatedTarget;
        const currentTarget = e.currentTarget;

        const insideInlineToolsContainer =
          relatedTarget && this.isInsideInlineToolsContainer(relatedTarget, ECOS_GRID_INLINE_TOOLS_CONTAINER);
        if (insideInlineToolsContainer) {
          return;
        }

        if (props.changeTrOptionsByRowClick) {
          this.setHover(currentTarget, ECOS_GRID_HOVERED_CLASS, true);
        }

        this._tr = null;

        const { onRowMouseLeave } = this.props;
        if (isFunction(onRowMouseLeave)) {
          onRowMouseLeave(e);
        }

        if (!props.changeTrOptionsByRowClick) {
          this.removeInlineToolsElement(currentTarget);
        }
      },
      onClick: e => {
        const currentTarget = e.currentTarget;

        if (props.changeTrOptionsByRowClick) {
          const settingInlineTools = this.getTrOptions(currentTarget);

          this.removeInlineToolsElement();

          if (get(this.props.data[currentTarget.rowIndex - 1], 'id') !== this.state.selectedRowId) {
            this.appendInlineToolsElement(currentTarget, settingInlineTools);
          }
        }

        this.onRowClick(currentTarget);
      },
      draggable: !!props.draggable,
      onDoubleClick: this.onDoubleClick,
      onDragOver: this.onDragOver,
      onDragStart: this.onDragStart,
      onDragEnd: this.onDragEnd,
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

    if (props.footerValue && options.columns && options.columns.length) {
      options.columns.forEach(column => {
        const columnSum = props.footerValue[column.attribute];

        if (columnSum) {
          column.footer = columnSum;
          column.footerClasses = 'ecos-grid__table_footer__cell';
        } else {
          column.footer = '';
        }
      });
    }

    return options;
  }

  removeInlineToolsElement = currentTarget => {
    if (currentTarget) {
      const inlineToolsElement = currentTarget.querySelector(`.${ECOS_GRID_INLINE_TOOLS_CONTAINER}`);
      if (inlineToolsElement) {
        currentTarget._inlineToolsRoot?.unmount();
        currentTarget.removeChild(inlineToolsElement);
        currentTarget.classList.remove(HAS_INLINE_TOOLS_CLASS);
      }
    } else {
      const inlineToolsElement = document.querySelector(`.${ECOS_GRID_INLINE_TOOLS_CONTAINER}`);
      if (inlineToolsElement) {
        const parentElement = inlineToolsElement.parentNode;
        inlineToolsElement.remove();

        if (parentElement && !parentElement.querySelector(`.${ECOS_GRID_INLINE_TOOLS_CONTAINER}`)) {
          parentElement._inlineToolsRoot?.unmount();
          parentElement.classList.remove(HAS_INLINE_TOOLS_CLASS);
        }
      }
    }
  };

  updateInlineToolsElementOfLoading = () => {
    const current = this._ref.current;
    if (!current) {
      return;
    }

    const trEl = current.querySelector(`.${ECOS_GRID_INLINE_TOOLS_CONTAINER}`)?.closest('tr');

    if (!trEl) {
      return;
    }

    trEl._inlineToolsRoot?.unmount();
    const settingInlineTools = this.getTrOptions(trEl);
    this.appendInlineToolsElement(trEl, settingInlineTools);
  };

  appendInlineToolsElement = (currentTarget, settingInlineTools) => {
    const inlineToolsElement = document.createElement('td');
    inlineToolsElement.className = ECOS_GRID_INLINE_TOOLS_CONTAINER;

    if (!isEmpty(settingInlineTools) && isFunction(this.props.inlineTools)) {
      const inlineTools = this.inlineTools(settingInlineTools);

      if (inlineTools) {
        const root = createRoot(inlineToolsElement);
        root.render(inlineTools);

        currentTarget.appendChild(inlineToolsElement);
        currentTarget.classList.add(HAS_INLINE_TOOLS_CLASS);

        currentTarget._inlineToolsRoot = root;
      }
    } else if (isFunction(this.props.inlineActions)) {
      const inlineActions = this.props.inlineActions(get(settingInlineTools, 'row.id') || null);

      if (inlineActions) {
        const root = createRoot(inlineToolsElement);
        root.render(inlineActions);

        currentTarget.appendChild(inlineToolsElement);
        currentTarget.classList.add(HAS_INLINE_TOOLS_CLASS);

        currentTarget._inlineToolsRoot = root;
      }
    }
  };

  isInsideInlineToolsContainer = (element, containerClass) => {
    while (element) {
      if (element.classList && element.classList.contains(containerClass)) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  };

  checkColumnEditable = (...data) => {
    const { editingRules = {} } = this.props;
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
    const parent = isElement(tr) && tr.closest(`.${REACT_BOOTSTRAP_TABLE}`);
    const foundTr = isFunction(get(parent, 'nextSibling.getElementsByTagName')) && parent.nextSibling.getElementsByTagName('tr');
    const node = get(foundTr, [index]) && head(foundTr[index].getElementsByClassName('ecos-grid__checkbox'));

    return get(node, 'classList', null);
  };

  getTrOptions = tr => {
    const { data, onChangeTrOptions } = this.props;

    const rowIndex = tr.rowIndex - 1;

    const row = data[rowIndex];

    this._tr = tr;

    isFunction(onChangeTrOptions) && onChangeTrOptions({ row, position: tr.rowIndex - 1 });

    return { row, position: tr.rowIndex - 1 };
  };

  setEditable = () => {
    return cellEditFactory({
      mode: 'dbclick',
      blurToSave: true,
      afterSaveCell: this.onEdit
    });
  };

  initFormatter = ({ editable, className, column, isViewNewJournal, isBlockNewJournalFormatter }) => {
    return (cell, row, rowIndex, formatExtraData = {}) => {
      const { newFormatter = {} } = column;
      const { error } = row;
      const Formatter = formatExtraData.formatter;

      let content = cell;
      if (!isEmpty(newFormatter) && newFormatter.type) {
        content = FormatterService.format(
          { cell, row, rowIndex, column, isViewNewJournal: isBlockNewJournalFormatter ? false : isViewNewJournal },
          newFormatter
        );
      } else if (Formatter) {
        content = <Formatter row={row} cell={cell} rowIndex={rowIndex} {...formatExtraData} />;
      }

      return (
        <ErrorCell data={cell}>
          <div
            className={classNames('ecos-grid__td', {
              'ecos-grid__td_editable': editable,
              'ecos-grid__td_error': error && row[error] === cell,
              'ecos-grid__td_max-width':
                newFormatter && (newFormatter.type === DateTimeFormatter.TYPE || newFormatter.type === DateFormatter.TYPE),
              [className]: !!className
            })}
          >
            {content}
          </div>
        </ErrorCell>
      );
    };
  };

  initFooterFormatter = name => {
    const { loading = false, journalId = '' } = this.props;

    return column => {
      const { newFormatter = {}, footer } = column;

      let content = footer;

      if (!content) {
        return '';
      }

      if (content === 'loading' || loading) {
        content = <Loader type="points" height={10} width={18} />;
      } else if (!isEmpty(newFormatter) && ['duration', 'number'].includes(newFormatter.type)) {
        content = FormatterService.format({ cell: footer, column }, newFormatter);
      }

      if (!this.state.hasFooter) {
        this.setState({ hasFooter: true });
      }

      const targetId = `total-amount-${journalId}_${name}`.replace(/\:/g, '');

      return (
        <div className="ecos-grid__table_footer__value">
          <EcosTooltip target={targetId} showAsNeeded uncontrolled text={content}>
            <div id={targetId} className="ecos-grid__table_footer__item text">
              {t('grid.footer.total-amount')}
            </div>

            <div className="ecos-grid__table_footer__item">{content}</div>
          </EcosTooltip>
        </div>
      );
    };
  };

  setHeaderFormatter = (column, filterable, sortable, width) => {
    const { filters, sortBy, onSort, onFilter, onOpenSettings, originPredicates, recordRef, deselectAllRecords, isViewNewJournal } =
      this.props;
    const isFilterable = filterable && column.searchable && column.searchableByText && isFunction(onFilter);
    const disableSelect = column.disableSelect;
    const isSortable = sortable && isFunction(onSort);

    column.headerFormatter = (column, colIndex) => {
      const filterPredicates = (filters || []).filter(filter => filter.att === column.attribute) || [];
      const filterPredicate = head(filterPredicates) || {};
      const filterValue = filterPredicate.val || '';
      const sort = find(sortBy, sort => sort.attribute === column.attribute) || {};
      const ascending = sort.ascending;
      const originPredicate = find(originPredicates, predicate => predicate.att === column.attribute) || {};

      return (
        <HeaderFormatter
          recordRef={recordRef}
          originPredicate={originPredicate}
          isComplexFilter={filterPredicates.length > COMPLEX_FILTER_LIMIT}
          predicate={filterPredicate}
          filterable={isFilterable}
          filterValue={filterValue}
          onFilter={this.onFilter}
          sortable={isSortable}
          disableSelect={disableSelect}
          onSort={this.onSort}
          ascending={ascending}
          column={column}
          colIndex={colIndex}
          onDividerMouseDown={this.getStartDividerPosition}
          onOpenSettings={onOpenSettings}
          deselectAllRecords={deselectAllRecords}
          clearSelectedState={this.clearSelectedState}
          colWidth={width}
          isViewNewJournal={isViewNewJournal}
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

  createMultiSelectionCheckboxes(gridProps) {
    const selected = gridProps.selectAll ? this.getSelectedPageItems() : this.state.selected || [];

    return {
      mode: BootstrapTableConst.ROW_SELECT_MULTIPLE,
      classes: 'ecos-grid__tr_selected',
      selected,
      nonSelectable: gridProps.nonSelectable || [],
      onSelect: this.handleSelectCheckbox,
      onSelectAll: this.handleSelectAllCheckbox,
      selectionHeaderRenderer: props => (
        <SelectorHeader {...props} hasMenu={!gridProps.noSelectorMenu} onClickMenu={this.handleClickMenuCheckbox} />
      ),
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
    const { nonSelectable } = this.props;
    const { selected } = this.state;
    const page = this.getSelectedPageItems();
    const ids = rows.map(row => row.id);
    const isSelectedPage = allPage || (!allPage && rows.length < page.length);
    const newSelected = isSelectedPage ? [...selected, ...page] : selected.filter(item => !ids.includes(item));

    (nonSelectable || []).forEach(item => {
      if (selected.includes(item)) {
        newSelected.push(item);
      }
    });

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
    this._resizingTh.dataset.name = options.name;
    this._resizingTh.dataset.id = options.id;
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

        if (isElement(get(resizeCol, 'children[0]')) && resizeCol.children[0].classList.contains('ecos-th')) {
          resizeCol.children[0].style.width = cssNum(width);
        }

        if (isElement(lastCol)) {
          lastCol.style.width = cssNum(parseFloat(lastWidth) + (parseFloat(resizeWidth) - width));
        }
      }
    }
  };

  get isNotSavingSetting() {
    const { journalSetting = {}, journalSettings = [] } = this.props;

    let originSetting;

    if (isArray(journalSettings) && !isUndefined(get(journalSetting, 'id'))) {
      originSetting = journalSettings.find(setting => setting.id === journalSetting.id);
    }

    return (
      originSetting &&
      isArray(get(journalSetting, 'groupBy')) &&
      journalSetting.groupBy.length !== 0 &&
      !isEqual(journalSetting.groupBy, get(originSetting, 'settings.groupBy'))
    );
  }

  get hasGrouping() {
    const { journalSetting = {} } = this.props;
    return isArray(get(journalSetting, 'groupBy')) && journalSetting.groupBy.length !== 0;
  }

  clearResizingColumn = e => {
    const { journalId } = this.props;

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

      if (journalId && this.userName) {
        if (!this.isNotSavingSetting) {
          this.setState({
            updatedColumn: {
              cellIndex: this._resizingTh.cellIndex,
              width: this._resizingTh.style.width,
              name: this._resizingTh.dataset.name,
              id: this._resizingTh.dataset.id
            }
          });
        } else {
          this.setState({
            updatedColumnBlocked: {
              flag: true,
              id: this._resizingTh.dataset.id
            }
          });
        }
      }
    }

    this._resizingTh = null;
  };

  inlineTools = settings => {
    const { inlineTools } = this.props;

    return isFunction(inlineTools) ? inlineTools(settings) : null;
  };

  tools = selected => {
    const { tools } = this.props;

    isFunction(tools) && tools(selected);

    return null;
  };

  saveColumnWidth = async () => {
    const { journalId, onColumnSave, journalSetting = {} } = this.props;
    const { updatedColumn } = this.state;
    const { name, width } = updatedColumn;

    if (!journalId) {
      this.closeColumnWidth();
      return;
    }

    try {
      let dbValue = (await pagesStore.get(journalId)) || {
        pageId: journalId,
        [this.userName]: {
          settings: {},
          columns: {}
        }
      };

      let currentColumn = dbValue[this.userName]?.columns[name] || {};

      if (journalSetting && !isEmpty(journalSetting) && get(journalSetting, 'id')) {
        dbValue[this.userName] = {
          ...dbValue[this.userName],
          settings: {
            ...get(dbValue, `${this.userName}.settings`, {}),
            [journalSetting.id]: {
              ...get(dbValue, `${this.userName}.settings.${journalSetting.id}`),
              [name]: {
                ...currentColumn,
                width
              }
            }
          }
        };
      } else {
        dbValue[this.userName] = {
          ...dbValue[this.userName],
          columns: {
            ...get(dbValue[this.userName], 'columns', {}),
            [name]: {
              ...currentColumn,
              width
            }
          }
        };
      }

      await pagesStore.put(dbValue);
      onColumnSave(updatedColumn);
      NotificationManager.success(t('grid.column.save.message.success'), t('success'), 3000);
    } catch (e) {
      NotificationManager.error(t('grid.column.save.message.error'), t('error'), 3000);
      console.error(e);
    }

    this.closeColumnWidth();
  };

  closeColumnWidth = () => {
    this.setState({
      updatedColumn: null,
      updatedColumnBlocked: null
    });
  };

  onMouseLeave = e => {
    const { onMouseLeave } = this.props;
    isFunction(onMouseLeave) && onMouseLeave(e);
  };

  onMouseEnter = e => {
    const { onGridMouseEnter } = this.props;
    isFunction(onGridMouseEnter) && onGridMouseEnter(e);
  };

  onRowClick = tr => {
    this.setHover(tr, ECOS_GRID_HOVERED_CLASS, true);

    const { onRowClick } = this.props;

    const selectedRowId = get(this.props.data[tr.rowIndex - 1], 'id', null);
    if (selectedRowId !== this.state.selectedRowId) {
      this.setState({ selectedRowId });
    } else {
      this.setState({ selectedRowId: null });
    }

    isFunction(onRowClick) && onRowClick(this.props.data[tr.rowIndex - 1]);
  };

  onDoubleClick = (...params) => {
    this.props.onRowDoubleClick && this.props.onRowDoubleClick(params);
  };

  onSort = e => {
    const { onSort } = this.props;
    isFunction(onSort) && onSort(e);
  };

  onFilter = (predicates, type) => {
    const { onFilter } = this.props;
    isFunction(onFilter) && onFilter(predicates, type);
  };

  onEdit = (oldValue, newValue, row, column) => {
    const { onEdit } = this.props;

    if (oldValue !== newValue) {
      isFunction(onEdit) &&
        onEdit({
          id: row[this.props.keyField],
          attributes: {
            [column.attribute]: newValue
          }
        });
    }
  };

  onScrollStart = e => {
    const { onScrollStart } = this.props;

    this.setState({ isScrolling: true });

    isFunction(onScrollStart) && onScrollStart(e);
  };

  onScrollFrame = e => {
    const { onScrolling } = this.props;

    this._scrollValues = e;

    if (this.fixedHeader) {
      if (this.hasCheckboxes) {
        set(this._shadowLeftNode, 'style.display', e.scrollLeft > 0 ? 'block' : 'none');
      }
      set(this._shadowHeadNode, 'style.display', e.scrollTop > 0 ? 'block' : 'none');
      set(this._firstHeaderCellNode, 'style.display', e.scrollLeft > 0 ? 'none' : 'block');
    }

    isFunction(onScrolling) && onScrolling(e);
  };

  onScrollStop = e => {
    const { onScrollStop } = this.props;

    this.setState({ isScrolling: false });
    isFunction(onScrollStop) && onScrollStop(e || this._scrollRef.getValues());
  };

  onDragStart = e => {
    const { onDragStart } = this.props;

    if (!onDragStart) {
      return false;
    }

    const rowIndex = get(e, 'target.rowIndex');
    isFunction(onDragStart) && onDragStart(e, isNumber(rowIndex) ? get(this.props.data, [rowIndex - 1, 'id'], null) : null);
  };

  onDragEnd = e => {
    const { onDragEnd } = this.props;

    if (!onDragEnd) {
      return false;
    }

    isFunction(onDragEnd) && onDragEnd(e);
  };

  onDragOver = e => {
    const { onRowDrop, onDragOver } = this.props;

    if (onRowDrop) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (!onDragOver) {
      return false;
    }

    isFunction(onDragOver) && onDragOver(e);
  };

  checkDropPermission = tr => {
    const { onCheckDropPermission, data } = this.props;

    if (isFunction(onCheckDropPermission)) {
      const item = data[tr.rowIndex - 1];

      if (!item) {
        return false;
      }

      const canDrop = onCheckDropPermission(item);

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

    const { onRowDragEnter } = this.props;

    const target = e.target;
    const tr = isElement(target) ? target.closest(`.${ECOS_GRID_ROW_CLASS}`) : null;

    isFunction(onRowDragEnter) && onRowDragEnter(e);

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

    const { onRowDrop } = this.props;

    e.preventDefault();
    e.stopPropagation();

    const tr = e.currentTarget;

    this.setHover(tr, ECOS_GRID_GRAG_CLASS, true, this._tr);

    isFunction(onRowDrop) &&
      onRowDrop({
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
      minHeight: _minHeight,
      autoHeight,
      scrollAutoHide,
      tableViewClassName,
      gridWrapperClassName,
      hTrackClassName,
      isViewNewJournal,
      data
    } = this.props;

    let { maxHeight } = this.state;
    let scrollStyle = {};
    let scrollProps = {};

    const ecosJournalEl = this._ref && this._ref.current ? this._ref.current.closest(`.${ECOS_JOURNAL_CLASS}`) : null;
    const minHeight = _minHeight > JOURNAL_MIN_HEIGHT && isViewNewJournal && ecosJournalEl ? JOURNAL_MIN_HEIGHT : _minHeight;

    if (isViewNewJournal && ecosJournalEl) {
      scrollStyle = { ...scrollStyle, height: maxHeight };
    } else {
      if (autoHeight) {
        scrollProps = { ...scrollProps, autoHeight, autoHeightMax: maxHeight, autoHeightMin: minHeight };
      } else {
        scrollStyle = { ...scrollStyle, height: minHeight || '100%' };
      }
    }

    if (this._scrollRef && data && data.length && !ecosJournalEl && this._tableDom && get(scrollStyle, 'height') && !autoHeight) {
      const scrollHeight = this._scrollRef.getScrollHeight();
      if (scrollStyle.height !== '100%' && scrollHeight > scrollStyle.height) {
        const rows = this._tableDom.querySelectorAll(`tr.${ECOS_GRID_ROW_CLASS}`);
        if (rows && rows.length) {
          rows.forEach(row => {
            scrollStyle.height += row.clientHeight - HEIGHT_TABLE_ROW_IN_WIDGET;
          });
        }
      }
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

  renderTemp() {}

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
    const { rowClassName, resizableColumns, isViewNewJournal, ...extraProps } = pick(this.props, [
      'rowClassName',
      'isViewNewJournal',
      'resizableColumns',
      'columns',
      'rowEvents'
    ]);

    const bootProps = this.getBootstrapTableProps(props, cloneDeep(extraProps));
    const rulesKey = `table-${isEmpty(this.props.editingRules) ? 'without' : 'with'}-rules-${JSON.stringify(this.props.editingRules || {})}`;

    return (
      <div ref={this.setGridRef}>
        <ErrorTable>
          <BootstrapTable
            key={rulesKey}
            {...bootProps}
            classes={classNames('ecos-grid__table', {
              'ecos-grid__table_grouping': this.hasGrouping && isViewNewJournal
            })}
            headerClasses={classNames(ECOS_GRID_HEADER, {
              'ecos-grid__header_columns-not-resizable': !resizableColumns
            })}
            rowClasses={classNames(ECOS_GRID_ROW_CLASS, rowClassName, {
              'ecos-grid__row_new': isViewNewJournal
            })}
            footerClasses={classNames('ecos-grid__table_footer', {
              'ecos-grid__table_footer-hide': !this.props.footerValue
            })}
          />
        </ErrorTable>
      </div>
    );
  }

  render() {
    const { className, noTopBorder, columns, noHeader, scrollable, selected, multiSelectable, noHorizontalScroll } = this.props;
    const { updatedColumn, updatedColumnBlocked } = this.state;

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
          'ecos-grid_no-scroll_h': noHorizontalScroll,
          [className]: !!className
        })}
        onMouseLeave={this.onMouseLeave}
        onMouseEnter={this.onMouseEnter}
      >
        {!!toolsVisible && this.tools(selected)}

        {scrollable ? this.renderScrollableGrid() : this.renderGrid()}

        {/* Cause: overrides checkboxes in Safari (ECOSUI-3299) */}
        {/*{isViewNewJournal && !hasFooter && !!data && !!data.length && (
          <div style={{ height: cssNum(maxHeight) }} className="ecos-grid__border" />
        )}*/}

        {updatedColumn && (
          <Tooltip
            target={updatedColumn.id}
            placement="top"
            boundariesElement="window"
            isOpen
            className={classNames('ecos-base-tooltip')}
            popperClassName={classNames('ecos-base-tooltip-popper', 'ecos-grid-tooltip', 'ecos-grid-tooltip__wrapper')}
            arrowClassName={classNames('ecos-base-tooltip-arrow')}
            innerClassName={classNames('ecos-base-tooltip-inner', 'ecos-grid-tooltip__inner')}
          >
            <ClickOutside handleClickOutside={this.closeColumnWidth}>
              <div className={classNames('ecos-grid-tooltip__content')}>
                <Icon className="icon-small-close ecos-grid-tooltip__close" onClick={this.closeColumnWidth} />

                {t('grid.column.is-save')}

                <Button onClick={this.saveColumnWidth} className={classNames('ecos-grid-tooltip__button')}>
                  {t('grid.column.save')}
                </Button>
              </div>
            </ClickOutside>
          </Tooltip>
        )}

        {get(updatedColumnBlocked, 'flag') && get(updatedColumnBlocked, 'id') && (
          <Tooltip
            target={updatedColumnBlocked.id}
            placement="top"
            boundariesElement="window"
            isOpen
            className={classNames('ecos-base-tooltip')}
            popperClassName={classNames('ecos-base-tooltip-popper', 'ecos-grid-tooltip', 'ecos-grid-tooltip__wrapper')}
            arrowClassName={classNames('ecos-base-tooltip-arrow')}
            innerClassName={classNames('ecos-base-tooltip-inner', 'ecos-grid-tooltip__inner')}
          >
            <ClickOutside handleClickOutside={this.closeColumnWidth}>
              <div className={classNames('ecos-grid-tooltip__content')}>
                <Icon className="icon-small-close ecos-grid-tooltip__close" onClick={this.closeColumnWidth} />
                {t('grid.column.is-save-blocked')}
              </div>
            </ClickOutside>
          </Tooltip>
        )}

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
  recordRef: PropTypes.string,
  journalId: PropTypes.string,

  filterable: PropTypes.bool,
  editable: PropTypes.bool,
  multiSelectable: PropTypes.bool,
  singleSelectable: PropTypes.bool,
  freezeCheckboxes: PropTypes.bool,
  selectAll: PropTypes.bool,
  noSelectorMenu: PropTypes.bool,
  fixedHeader: PropTypes.bool,
  loading: PropTypes.bool,
  noHeader: PropTypes.bool,
  noTopBorder: PropTypes.bool,
  scrollable: PropTypes.bool,
  scrollAutoHide: PropTypes.bool,
  autoHeight: PropTypes.bool,
  byContentHeight: PropTypes.bool,
  sortable: PropTypes.bool,
  withDateFilter: PropTypes.bool,
  isResetSettings: PropTypes.bool,
  resizableColumns: PropTypes.bool,
  noHorizontalScroll: PropTypes.bool,
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
  onColumnSave: PropTypes.func,
  inlineTools: PropTypes.func,
  inlineActions: PropTypes.func,
  journalSetting: PropTypes.object,
  journalSettings: PropTypes.array,

  deselectAllRecords: PropTypes.func
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
