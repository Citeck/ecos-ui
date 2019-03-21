import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Grid, InlineTools, Tools } from '../../common/grid';
import Loader from '../../common/Loader/Loader';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';
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
    const inlineToolsActionClassName = 'grid__inline-tools-btn btn_i btn_brown btn_width_auto btn_hover_t-dark-brown btn_x-step_10';

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
    const toolsActionClassName = 'btn_i_sm btn_grey4 btn_hover_t-dark-brown';
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

  render() {
    const props = this.props;
    const params = (props.journalConfig || {}).params || {};
    const defaultSortBy = params.defaultSortBy ? eval('(' + params.defaultSortBy + ')') : [];

    return (
      <div ref={this.gridWrapperRef} className={'journal-dashlet__grid'}>
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
            <Grid
              {...props.gridData}
              className={props.loading ? 'grid_transparent' : ''}
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
          </Fragment>
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
