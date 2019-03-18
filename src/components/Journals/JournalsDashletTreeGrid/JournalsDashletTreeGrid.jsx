import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Grid, TreeGrid } from '../../common/grid';
import Loader from '../../common/Loader/Loader';
import { setGridMinHeight } from '../../../actions/journals';

const mapStateToProps = state => ({
  loading: state.journals.loading,
  maxGridItems: state.journals.maxGridItems,
  gridData: state.journals.gridData,
  gridMinHeight: state.journals.gridMinHeight,
  journalConfig: state.journals.journalConfig
});

const data = [
  {
    children: [
      {
        children: ['Договор №4202'],
        sum: '1.2',
        value: 'Договор №4202',
        id: 0
      },
      {
        children: ['Договор №312'],
        sum: '1.3',
        value: 'Договор №312',
        id: 1
      },
      {
        children: ['Договор №412'],
        sum: '1.0',
        value: 'Договор №412',
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
    sum: '1.3',
    value: 'Договор №31',
    id: 1
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
    value: 'Договор №41',
    id: 2
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
    sum: '10.0',
    value: 'Договор №1',
    id: 3
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
    sum: '1000.0',
    value: 'Договор №уыкцй',
    id: 4
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

const mapDispatchToProps = dispatch => ({
  setGridMinHeight: ({ height }) => dispatch(setGridMinHeight(height))
});

class JournalsDashletTreeGrid extends Component {
  constructor(props) {
    super(props);
    this.emptyGridRef = React.createRef();
  }

  componentDidMount() {
    const props = this.props;
    const grid = this.emptyGridRef.current || {};
    const height = grid.offsetHeight;

    if (height && !props.gridMinHeight) {
      props.setGridMinHeight({ height });
    }
  }

  loadChild = e => {
    console.log(e);
    // const props = this.props;
    // const {columns, meta: { criteria }} = props.journalConfig;
    //
    // const filter = [
    //   {
    //     field: 'cm:title',
    //     predicate: 'string-contains',
    //     value: e.value
    //   }
    // ];
    //
    // props.reloadGrid({ columns, criteria: [...filter, ...criteria] });
  };

  render() {
    const props = this.props;

    // console.log(props.gridData.data);

    return (
      <div className={'journal-dashlet__grid'}>
        {props.loading ? (
          <Fragment>
            <Loader />
            <div ref={this.emptyGridRef}>
              <Grid
                data={Array.from(Array(props.maxGridItems), (e, i) => ({ id: i }))}
                columns={[{ dataField: '_', text: ' ' }]}
                className={props.loading ? 'grid_transparent' : ''}
              />
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <TreeGrid
              {...props.gridData}
              data={data}
              minHeight={props.gridMinHeight}
              onExpand={this.loadChild}
              children={[
                {
                  path: [1, 1],
                  data: {}
                },
                {
                  path: [9, 0],
                  data: {}
                }
              ]}
            />
          </Fragment>
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletTreeGrid);
