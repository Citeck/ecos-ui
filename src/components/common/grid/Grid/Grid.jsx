import $ from 'jquery';
import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import BootstrapTable from 'react-bootstrap-table-next';
import Icon from '../../icons/Icon/Icon';
import Checkbox from '../../form/Checkbox/Checkbox';
import { IcoBtn, Btn } from '../../btns';
import PerfectScrollbar from 'react-perfect-scrollbar';

import 'react-perfect-scrollbar/dist/css/styles.css';
import './Grid.scss';

class HeaderFormatter extends Component {
  render() {
    return (
      <div className={'grid__th'}>
        <span>{this.props.column.text}</span>
        <Icon className={'grid__filter icon-filter'} />
      </div>
    );
  }
}

const KEY_FIELD = 'id';

export default class Grid extends Component {
  _setWidth = column => {
    column.style = {
      ...column.style,
      width: column.width
    };

    return column;
  };

  _setHeaderFormatter = column => {
    column.headerFormatter = (column, colIndex) => {
      return <HeaderFormatter column={column} colIndex={colIndex} />;
    };

    return column;
  };

  _setAdditionalOptions(props) {
    props.columns = props.columns.map(column => {
      if (column.width) {
        column = this._setWidth(column);
      }

      column = this._setHeaderFormatter(column);

      return column;
    });

    if (props.hasInlineTools) {
      props.rowEvents = {
        onMouseEnter: e => this.createInlineTools($(e.target).closest('tr'))
      };
    }

    if (props.hasCheckboxes) {
      props.selectRow = this.createCheckboxs(props);
    }

    return props;
  }

  createInlineTools = $tr => {
    const inlineToolsClass = 'grid__inline-tools';
    const inlineToolsClassContainerClass = 'grid__inline-tools-container';
    const inlineToolsBtnClass = 'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10';

    const $currentTr = $tr.addClass(inlineToolsClassContainerClass).mouseleave(function() {
      // $(this).removeClass(inlineToolsClassContainerClass);
      // $(this).find(`div.${inlineToolsClass}`).remove();
    });
    const $inlineTools = $(`<div class='${inlineToolsClass}'></div>`).appendTo($currentTr)[0];

    let pos = $currentTr.position();

    $('#test-test').css('top', pos.top + 'px');

    ReactDOM.render(
      <Fragment>
        <IcoBtn icon={'icon-download'} className={inlineToolsBtnClass} />
        <IcoBtn icon={'icon-on'} className={inlineToolsBtnClass} />
        <IcoBtn icon={'icon-edit'} className={inlineToolsBtnClass} />
        <IcoBtn icon={'icon-delete'} className={inlineToolsBtnClass} />
      </Fragment>,
      $inlineTools
    );
  };

  createCheckboxs(props) {
    this._selected = props.selectAllRecords ? props.data.map(row => row[props.keyField || KEY_FIELD]) : props.selected || [];

    return {
      mode: 'checkbox',
      classes: 'grid__tr_selected',
      selected: this._selected,
      onSelect: (row, isSelect) => {
        const selected = this._selected;
        const keyField = row[props.keyField || KEY_FIELD];

        this._selected = isSelect ? [...selected, keyField] : selected.filter(x => x !== keyField);

        this.triggerEvent('onSelect', {
          selected: this._selected,
          all: false
        });
      },
      onSelectAll: (isSelect, rows) => {
        const keyField = props.keyField || KEY_FIELD;

        this._selected = isSelect ? [...this._selected, ...rows.map(row => row[keyField])] : this.getSelectedByPage(this.props.data, false);

        this.triggerEvent('onSelect', {
          selected: this._selected,
          all: true
        });
      },
      selectionHeaderRenderer: ({ indeterminate, ...rest }) => {
        return (
          <div className={'grid__th grid__th_checkbox'}>
            <Checkbox indeterminate={indeterminate} checked={rest.checked} />
          </div>
        );
      },
      selectionRenderer: ({ mode, ...rest }) => {
        return (
          <div className={'grid__td_checkbox'}>
            <Checkbox checked={rest.checked} />
          </div>
        );
      }
    };
  }

  onDelete = () => {
    this.triggerEvent('onDelete', this._selected);
  };

  triggerEvent = (name, data) => {
    const callback = this.props[name];

    if (typeof callback === 'function') {
      callback.call(this, data);
    }
  };

  toolsVisible = () => {
    return this._selected.length && this.getSelectedByPage(this.props.data, true).length;
  };

  getSelectedByPage = (records, onPage) => {
    const keyField = this.props.keyField || KEY_FIELD;

    return this._selected.filter(id => {
      const length = records.filter(record => record[keyField] === id).length;
      return onPage ? length : !length;
    });
  };

  selectAll = () => {
    this.triggerEvent('onSelectAll');
  };

  render() {
    let props = {
      keyField: KEY_FIELD,
      bootstrap4: true,
      bordered: false,
      headerClasses: 'grid__header',
      noDataIndication: () => 'Нет элементов в списке',
      ...this.props
    };

    props = this._setAdditionalOptions(props);

    if (props.columns.length) {
      return (
        <div className={classNames('grid', props.hasCheckboxes && 'grid_checkable', this.props.className)}>
          {this.toolsVisible() ? (
            <div className={'grid__tools'}>
              {props.selectAllRecordsVisible ? (
                <div className={'grid__tools-item grid__tools-item_first'}>
                  <Btn
                    className={`btn_extra-narrow ${props.selectAllRecords ? 'btn_blue' : 'btn_grey5'} btn_hover_light-blue2`}
                    title={'Выбрать все'}
                    onClick={this.selectAll}
                  >
                    Выбрать все {props.total}
                  </Btn>
                </div>
              ) : null}
              <div className={'grid__tools-item grid__tools-item_first'}>
                <IcoBtn
                  icon={'icon-download'}
                  className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'}
                  title={'Скачать как Zip'}
                  onClick={this.zipDownload}
                />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-copy'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn icon={'icon-big-arrow'} className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'} />
              </div>
              <div className={'grid__tools-item'}>
                <IcoBtn
                  icon={'icon-delete'}
                  className={'btn_i_sm btn_grey4 btn_hover_t-dark-brown'}
                  title={'Удалить'}
                  onClick={this.onDelete}
                />
              </div>
            </div>
          ) : null}

          <PerfectScrollbar>
            <BootstrapTable {...props} />
          </PerfectScrollbar>

          {props.hasCheckboxes && <BootstrapTable {...props} classes={'grid__freeze'} />}
        </div>
      );
    }

    return null;
  }
}
