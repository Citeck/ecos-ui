import React, { Component } from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
//import filterFactory, { textFilter, dateFilter } from 'react-bootstrap-table2-filter';

// import 'xstyle!js/citeck/lib/react-bootstrap-table-next/react-bootstrap-table.css';
// import 'xstyle!js/citeck/lib/react-bootstrap-table-next/react-bootstrap-table2-filter.css';
import './Grid.scss';

export default class Grid extends Component {
  // _setFilter(column){
  //     if(!column.filter){
  //         switch (column.type) {
  //             case 'date':
  //                 column.filter = dateFilter({
  //                     placeholder: ' '
  //                 });
  //                 break;
  //             default:
  //                 column.filter = textFilter({
  //                     placeholder: ' '
  //                 });
  //                 break;
  //         }
  //     }
  //
  //     return column;
  // }

  _setWidth(column) {
    column.style = {
      ...column.style,
      width: column.width
    };

    return column;
  }

  _setAdditionalOptions(props) {
    props.columns = props.columns.map(column => {
      if (props.filter) {
        column = this._setFilter(column);
      }

      if (column.width) {
        column = this._setWidth(column);
      }

      return column;
    });

    return props;
  }

  render() {
    // let props = {
    //     ...this.props,
    //     noDataIndication: () => 'Нет элементов в списке',
    //     classes: 'table_table-layout_auto table_header-nowrap',
    //     bootstrap4: true,
    //     bordered: false,
    //     filter: filterFactory(),
    //     rowEvents: {
    //         onMouseEnter: e => {
    //             //let $currentTr = $(e.target).closest('tr').addClass('tr_overlay-container');
    //
    //             // $('<div class="tr_overlay">test</div>').appendTo($currentTr).mouseleave(function() {
    //             //     $currentTr.removeClass('tr_overlay-container');
    //             //     $(this).remove();
    //             // });
    //         }
    //     }
    // };

    //props = this._setAdditionalOptions(props);

    const columns = [
      {
        dataField: 'id',
        text: ''
      },
      {
        dataField: 'date',
        text: 'Дата создания'
      },
      {
        dataField: 'title',
        text: 'Заголовок'
      },
      {
        dataField: 'status',
        text: 'Статус'
      },
      {
        dataField: 'ure',
        text: 'Юридическое лицо'
      }
    ];

    const products = [
      {
        id: 1,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 2,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 3,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 4,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 5,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 6,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 7,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 8,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 9,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 10,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 11,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 12,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 13,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      },
      {
        id: 14,
        date: '12.12.2019 6:03',
        title: 'Договор №806',
        status: 'Действует',
        ure: 'ООО "ФИНТЕКС"'
      }
    ];

    return <BootstrapTable keyField="id" data={products} columns={columns} />;
  }
}
