import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Grid, InlineTools, Tools, EmptyGrid } from '../../common/grid';
import Loader from '../../common/Loader/Loader';
import { IcoBtn } from '../../common/btns';
import { t, trigger } from '../../../helpers/util';
import {
  reloadGrid,
  deleteRecords,
  saveRecords,
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setGridInlineToolSettings
} from '../../../actions/journals';

const mapStateToProps = state => ({
  loading: state.journals.loading,
  grid: state.journals.grid,
  journalConfig: state.journals.journalConfig,
  selectedRecords: state.journals.selectedRecords,
  selectAllRecords: state.journals.selectAllRecords,
  selectAllRecordsVisible: state.journals.selectAllRecordsVisible
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: options => dispatch(reloadGrid(options)),
  deleteRecords: records => dispatch(deleteRecords(records)),
  saveRecords: ({ id, attributes }) => dispatch(saveRecords({ id, attributes })),
  setSelectedRecords: records => dispatch(setSelectedRecords(records)),
  setSelectAllRecords: need => dispatch(setSelectAllRecords(need)),
  setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(visible)),
  setGridInlineToolSettings: ({ top, height }) => dispatch(setGridInlineToolSettings({ top, height }))
});

class JournalsDashletGrid extends Component {
  constructor(props) {
    super(props);
    this.emptyGridRef = React.createRef();
    this.wrapperRef = React.createRef();
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

  onFilter = predicates => {
    const props = this.props;
    const { columns } = props.journalConfig;

    this.filters = predicates;

    props.reloadGrid({ columns, predicates });
  };

  sort = e => {
    this.props.reloadGrid({
      sortBy: [
        {
          attribute: e.column.attribute,
          ascending: !e.ascending
        }
      ]
    });
  };

  componentDidMount() {
    this.createMouseLeaveEvent();
  }

  componentWillUnmount() {
    this.removeMouseLeaveEvent();
  }

  setGridInlineToolSettings = (e, offsets, row) => {
    const { doInlineToolsOnRowClick, setGridInlineToolSettings } = this.props;

    setGridInlineToolSettings(offsets);

    if (doInlineToolsOnRowClick) {
      trigger.call(this, 'onRowClick', row);
    }
  };

  hideGridInlineToolSettings = () => {
    !this.props.doInlineToolsOnRowClick && this.props.setGridInlineToolSettings({ height: 0 });
  };

  createMouseLeaveEvent = () => {
    const grid = this.wrapperRef.current;
    if (grid) {
      grid.addEventListener('mouseleave', this.hideGridInlineToolSettings, false);
    }
  };

  removeMouseLeaveEvent = () => {
    const grid = this.wrapperRef.current;
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
          <IcoBtn icon={'icon-edit'} className={inlineToolsActionClassName} />,
          <IcoBtn icon={'icon-delete'} className={inlineToolsActionClassName} />
        ]}
      />
    );
  };

  deleteRecords = () => {
    const { selectedRecords, deleteRecords } = this.props;
    deleteRecords(selectedRecords);
  };

  tools = () => {
    const toolsActionClassName = 'ecos-btn_i_sm ecos-btn_grey4 ecos-btn_hover_t-dark-brown';
    const {
      selectAllRecordsVisible,
      selectAllRecords,
      grid: { total }
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
          <IcoBtn icon={'icon-delete'} className={toolsActionClassName} title={t('grid.tools.delete')} onClick={this.deleteRecords} />
        ]}
      />
    );
  };

  loadChild = e => {};

  render() {
    const {
      selectedRecords,
      selectAllRecords,
      saveRecords,
      className,
      loading,
      grid: {
        data,
        columns,
        sortBy,
        pagination: { maxItems }
      },
      doInlineToolsOnRowClick = false
    } = this.props;

    return (
      <div ref={this.wrapperRef} className={'ecos-journal-dashlet__grid'}>
        <EmptyGrid maxItems={maxItems} diff={15}>
          {loading ? (
            <Loader />
          ) : (
            <Grid
              data={data}
              columns={columns}
              className={className}
              freezeCheckboxes
              filterable
              editable
              multiSelectable
              sortBy={sortBy}
              filters={this.filters}
              inlineTools={this.inlineTools}
              tools={this.tools}
              onSort={this.sort}
              onFilter={this.onFilter}
              onSelect={this.setSelectedRecords}
              onRowClick={doInlineToolsOnRowClick ? this.setGridInlineToolSettings : null}
              onMouseEnter={doInlineToolsOnRowClick ? null : this.setGridInlineToolSettings}
              onEdit={saveRecords}
              selected={selectedRecords}
              selectAll={selectAllRecords}
            />
          )}
        </EmptyGrid>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
