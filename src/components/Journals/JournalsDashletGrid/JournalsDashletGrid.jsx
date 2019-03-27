import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Grid, InlineTools, Tools, TreeGrid, AsyncTreeGrid } from '../../common/grid';
import Loader from '../../common/Loader/Loader';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';
import { JournalsApi } from '../../../api';
import {
  reloadGrid,
  deleteRecords,
  saveRecords,
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setGridMinHeight,
  setGridInlineToolSettings
} from '../../../actions/journals';

const data = [
  {
    children: [
      {
        children: ['Договор №45'],
        sum: '1.2',
        value: '17.12.2018 04:00',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: '17.12.2018 04:00',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: '17.12.2018 04:00',
        id: 2
      }
    ],
    sum: '1.2',
    value: 'Договор №420',
    id: 0
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: '17.12.2018 04:00',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: '17.12.2018 04:00',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: '17.12.2018 04:00',
        id: 2
      }
    ],
    sum: '1.3',
    value: 'Договор №31',
    id: 1
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: '17.12.2018 04:00',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: '17.12.2018 04:00',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: '17.12.2018 04:00',
        id: 2
      }
    ],
    sum: '1.0',
    value: 'Договор №41',
    id: 2
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: '17.12.2018 04:00',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: '17.12.2018 04:00',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: '17.12.2018 04:00',
        id: 2
      }
    ],
    sum: '10.0',
    value: 'Договор №1',
    id: 3
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: '17.12.2018 04:00',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: '17.12.2018 04:00',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: '17.12.2018 04:00',
        id: 2
      }
    ],
    sum: '1000.0',
    value: 'Договор №уыкцй',
    id: 4
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: '17.12.2018 04:00',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: '17.12.2018 04:00',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: '17.12.2018 04:00',
        id: 2
      }
    ],
    sum: '5.0',
    value: 'Договор №35',
    id: 5
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '1.0',
    value: 'Договор №46',
    id: 6
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '7.0',
    value: 'Договор №23',
    id: 7
  },
  {
    children: [
      {
        children: ['Договор №420', 'Договор №420', 'Договор №420', 'Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '60.0',
    value: 'Договор №45',
    id: 8
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '2.0',
    value: 'Договор №33',
    id: 9
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '9999.0',
    value: 'Договор №44',
    id: 10
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '1.2',
    value: 'Договор №43',
    id: 11
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '1.4',
    value: 'Договор №39',
    id: 12
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '2.0',
    value: 'Договор №38',
    id: 13
  },
  {
    children: [
      {
        children: ['Договор №420'],
        sum: '1.2',
        value: 'Договор №420',
        id: 0
      },
      {
        children: ['Договор №31'],
        sum: '1.3',
        value: 'Договор №31',
        id: 1
      },
      {
        children: ['Договор №41'],
        sum: '1.0',
        value: 'Договор №41',
        id: 2
      }
    ],
    sum: '0.1',
    value: 'Договор №14',
    id: 14
  }
];

const mapStateToProps = state => ({
  loading: state.journals.loading,
  gridData: state.journals.gridData,
  journalConfig: state.journals.journalConfig,
  selectedRecords: state.journals.selectedRecords,
  selectAllRecords: state.journals.selectAllRecords,
  selectAllRecordsVisible: state.journals.selectAllRecordsVisible,
  gridMinHeight: state.journals.gridMinHeight,
  maxGridItems: state.journals.maxGridItems
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: ({ journalId, pagination, columns, criteria }) => dispatch(reloadGrid({ journalId, pagination, columns, criteria })),
  deleteRecords: records => dispatch(deleteRecords(records)),
  saveRecords: ({ id, attributes }) => dispatch(saveRecords({ id, attributes })),
  setSelectedRecords: records => dispatch(setSelectedRecords(records)),
  setSelectAllRecords: need => dispatch(setSelectAllRecords(need)),
  setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(visible)),
  setGridMinHeight: ({ height }) => dispatch(setGridMinHeight(height)),
  setGridInlineToolSettings: ({ top, height }) => dispatch(setGridInlineToolSettings({ top, height }))
});

class JournalsDashletGrid extends Component {
  constructor(props) {
    super(props);
    this.emptyGridRef = React.createRef();
    this.gridWrapperRef = React.createRef();
    this.filters = [];
  }

  setSelectedRecords = e => {
    const props = this.props;
    props.setSelectedRecords(e.selected);
    props.setSelectAllRecordsVisible(e.all);

    if (!e.all) {
      props.setSelectAllRecords(false);
    }
  };

  setSelectAllRecords = () => {
    const props = this.props;
    props.setSelectAllRecords(!props.selectAllRecords);

    if (!props.selectAllRecords) {
      props.setSelectedRecords([]);
    }
  };

  onFilter = filter => {
    const props = this.props;
    const {
      columns,
      meta: { criteria }
    } = props.journalConfig;

    this.filters = filter;

    props.reloadGrid({ columns, criteria: [...filter, ...criteria] });
  };

  componentDidMount() {
    const props = this.props;
    const grid = this.emptyGridRef.current || {};
    const height = grid.offsetHeight;

    if (height && !props.gridMinHeight) {
      props.setGridMinHeight({ height });
    }

    this.createMouseLeaveEvent();
  }

  componentWillUnmount() {
    this.removeMouseLeaveEvent();
  }

  setGridInlineToolSettings = (e, offsets) => {
    this.props.setGridInlineToolSettings(offsets);
  };

  hideGridInlineToolSettings = () => {
    this.props.setGridInlineToolSettings({ height: 0 });
  };

  createMouseLeaveEvent = () => {
    const grid = this.gridWrapperRef.current;
    if (grid) {
      grid.addEventListener('mouseleave', this.hideGridInlineToolSettings, false);
    }
  };

  removeMouseLeaveEvent = () => {
    const grid = this.gridWrapperRef.current;
    if (grid) {
      grid.removeEventListener('mouseleave', this.hideGridInlineToolSettings, false);
    }
  };

  inlineTools = () => {
    const inlineToolsActionClassName = 'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_hover_t-dark-brown ecos-btn_x-step_10';

    if (this.props.selectedRecords.length) {
      return null;
    }

    return (
      <InlineTools
        tools={[
          <IcoBtn icon={'icon-download'} className={inlineToolsActionClassName} />,
          <IcoBtn icon={'icon-on'} className={inlineToolsActionClassName} />,
          <IcoBtn icon={'icon-edit'} className={inlineToolsActionClassName} />,
          <IcoBtn icon={'icon-delete'} className={inlineToolsActionClassName} />
        ]}
      />
    );
  };

  tools = () => {
    const toolsActionClassName = 'ecos-btn_i_sm ecos-btn_grey4 ecos-btn_hover_t-dark-brown';
    const {
      selectAllRecordsVisible,
      selectAllRecords,
      gridData: { total },
      deleteRecords
    } = this.props;

    return (
      <Tools
        onSelectAll={this.setSelectAllRecords}
        selectAllVisible={selectAllRecordsVisible}
        selectAll={selectAllRecords}
        total={total}
        tools={[
          <IcoBtn icon={'icon-download'} className={toolsActionClassName} title={t('grid.tools.zip')} />,
          <IcoBtn icon={'icon-copy'} className={toolsActionClassName} />,
          <IcoBtn icon={'icon-big-arrow'} className={toolsActionClassName} />,
          <IcoBtn icon={'icon-delete'} className={toolsActionClassName} title={t('grid.tools.delete')} onClick={deleteRecords} />
        ]}
      />
    );
  };

  loadChild = e => {};

  render() {
    const props = this.props;
    const params = (props.journalConfig || {}).params || {};
    const loading = props.loading;

    // eslint-disable-next-line
    const defaultSortBy = params.defaultSortBy ? eval('(' + params.defaultSortBy + ')') : [];

    return (
      <div ref={this.gridWrapperRef} className={'ecos-journal-dashlet__grid'}>
        {loading ? (
          <Fragment>
            <Loader />
            <div ref={this.emptyGridRef}>
              <Grid
                data={Array.from(Array(props.maxGridItems), (e, i) => ({ id: i }))}
                columns={[{ dataField: '_', text: ' ' }]}
                className={loading ? 'ecos-grid_transparent' : ''}
              />
            </div>
          </Fragment>
        ) : props.gridData.isTree ? (
          <TreeGrid
            {...props.gridData}
            data={data}
            minHeight={props.gridMinHeight}
            onExpand={this.loadChild}
            lastLevelContent={(row, level) => {
              const api = new JournalsApi();
              const props = this.props;
              const {
                columns,
                meta: { criteria }
              } = props.journalConfig;

              let filter = [
                {
                  field: 'cm:title',
                  predicate: 'string-contains',
                  value: row.children[0]
                }
              ];

              return <AsyncTreeGrid columns={columns} criteria={[...filter, ...criteria]} api={api.getGridData} level={level} />;
            }}
          />
        ) : (
          <Grid
            {...props.gridData}
            className={loading ? 'ecos-grid_transparent' : ''}
            freezeCheckboxes
            filterable
            editable
            multiSelectable
            defaultSortBy={defaultSortBy}
            filters={this.filters}
            inlineTools={this.inlineTools}
            tools={this.tools}
            onFilter={this.onFilter}
            onSelect={this.setSelectedRecords}
            onMouseEnter={this.setGridInlineToolSettings}
            onEdit={props.saveRecords}
            minHeight={props.gridMinHeight}
            selected={props.selectedRecords}
            selectAll={props.selectAllRecords}
          />
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
