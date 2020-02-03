import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import connect from 'react-redux/es/connect/connect';
import cloneDeep from 'lodash/cloneDeep';

import JournalsDownloadZip from '../JournalsDownloadZip';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import FormManager from '../../EcosForm/FormManager';
import { ParserPredicate } from '../../Filters/predicates';
import { EcosModal, Loader } from '../../common';
import { EmptyGrid, Grid, InlineTools, Tools } from '../../common/grid';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { RemoveDialog } from '../../common/dialogs';
import { goToNodeEditPage } from '../../../helpers/urls';
import { t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { PROXY_URI } from '../../../constants/alfresco';
import {
  deleteRecords,
  execRecordsAction,
  goToJournalsPage,
  performGroupAction,
  reloadGrid,
  saveRecords,
  setGridInlineToolSettings,
  setPerformGroupActionResponse,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords,
  setSettingsToUrl
} from '../../../actions/journals';
import { DEFAULT_INLINE_TOOL_SETTINGS } from '../constants';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    loading: newState.loading,
    grid: newState.grid,
    journalConfig: newState.journalConfig,
    selectedRecords: newState.selectedRecords,
    selectAllRecords: newState.selectAllRecords,
    selectAllRecordsVisible: newState.selectAllRecordsVisible,
    performGroupActionResponse: newState.performGroupActionResponse
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    deleteRecords: records => dispatch(deleteRecords(w(records))),
    saveRecords: ({ id, attributes }) => dispatch(saveRecords(w({ id, attributes }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(w(visible))),
    setGridInlineToolSettings: settings => dispatch(setGridInlineToolSettings(w(settings))),
    goToJournalsPage: row => dispatch(goToJournalsPage(w(row))),
    performGroupAction: options => dispatch(performGroupAction(w(options))),
    setPerformGroupActionResponse: options => dispatch(setPerformGroupActionResponse(w(options))),
    setSettingsToUrl: options => dispatch(setSettingsToUrl(w(options)))
  };
};

class JournalsDashletGrid extends Component {
  filters = [];
  selectedRow = {};
  scrollPosition = {};

  state = {
    isDialogShow: false
  };

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

  reloadGrid(options) {
    options = options || {};
    this.hideGridInlineToolSettings();
    this.props.reloadGrid({ ...options });
  }

  onFilter = predicates => {
    console.log('predicates', predicates);
    const { setSettingsToUrl, isWidget } = this.props;

    this.filters = predicates;
    this.reloadGrid({ predicates });

    if (!isWidget) {
      setSettingsToUrl({ predicates });
    }
  };

  onSort = e => {
    const { setSettingsToUrl, isWidget } = this.props;
    const sortBy = [
      {
        attribute: e.column.attribute,
        ascending: !e.ascending
      }
    ];

    this.reloadGrid({ sortBy });

    if (!isWidget) {
      setSettingsToUrl({ sortBy });
    }
  };

  setSelectedRow(row) {
    this.selectedRow = row;
  }

  getSelectedRow() {
    return this.selectedRow;
  }

  clearSelectedRow() {
    this.selectedRow = {};
  }

  showGridInlineToolSettings = options => {
    this.setSelectedRow(options.row);

    this.props.setGridInlineToolSettings(
      Object.assign(
        {
          actions: this.getCurrentRowInlineActions()
        },
        options
      )
    );
  };

  getCurrentRowInlineActions() {
    const {
      execRecordsAction,
      selectedRecords,
      grid: { groupBy = [], actions }
    } = this.props;
    let currentRow = this.getSelectedRow().id;

    if (selectedRecords.length) {
      return [];
    }

    if (groupBy.length) {
      return [
        {
          title: t('grid.inline-tools.details'),
          onClick: () => this.goToJournalPageWithFilter(),
          icon: 'icon-big-arrow'
        }
      ];
    }

    return ((actions || {})[currentRow] || []).map(action => {
      return Object.assign({}, action, {
        onClick: () => execRecordsAction([currentRow], action)
      });
    });
  }

  hideGridInlineToolSettings = () => {
    this.clearSelectedRow();
    this.props.setGridInlineToolSettings(DEFAULT_INLINE_TOOL_SETTINGS);
  };

  goToJournalPageWithFilter = () => {
    const selectedRow = this.getSelectedRow();
    this.props.goToJournalsPage(selectedRow);
  };

  edit = () => {
    const selectedRow = this.getSelectedRow();
    const recordRef = selectedRow.id;

    EcosFormUtils.editRecord({
      recordRef: recordRef,
      fallback: () => goToNodeEditPage(recordRef),
      onSubmit: () => this.reloadGrid()
    });
  };

  inlineTools = () => {
    const { stateId } = this.props;
    return <InlineTools stateId={stateId} />;
  };

  deleteRecords = () => {
    const { selectedRecords, deleteRecords } = this.props;
    deleteRecords(selectedRecords);
    this.closeDialog();
  };

  renderTools = selected => {
    const toolsActionClassName = 'ecos-btn_i_sm ecos-btn_grey4';
    const {
      stateId,
      selectAllRecordsVisible,
      selectAllRecords,
      grid: { total },
      journalConfig: {
        meta: { groupActions = [] }
      },
      toolsClassName
    } = this.props;

    return (
      <Tools
        onSelectAll={this.setSelectAllRecords}
        selectAllVisible={selectAllRecordsVisible}
        selectAll={selectAllRecords}
        total={total}
        className={toolsClassName}
        tools={[
          <JournalsDownloadZip stateId={stateId} selected={selected} />,
          <IcoBtn
            icon={'icon-copy'}
            className={classNames(toolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
            title={t('grid.tools.copy-to')}
          />,
          <IcoBtn
            icon={'icon-big-arrow'}
            className={classNames(toolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
            title={t('grid.tools.move-to')}
          />,
          <IcoBtn
            icon={'icon-delete'}
            className={classNames(toolsActionClassName, 'ecos-btn_hover_t_red')}
            title={t('grid.tools.delete')}
            onClick={this.showDeleteRecordsDialog}
          />,
          <Dropdown
            className={'grid-tools__item_left_5'}
            source={groupActions.filter(g => {
              if (selectAllRecords) {
                return g.type === 'filtered';
              }

              return g.type === 'selected';
            })}
            valueField={'id'}
            titleField={'title'}
            isButton={true}
            onChange={this.changeGroupAction}
          >
            <IcoBtn
              invert
              icon={'icon-down'}
              className={'dashlet__btn ecos-btn_extra-narrow grid-tools__item_select-group-actions-btn'}
              onClick={this.onGoTo}
            >
              {t('grid.tools.group-actions')}
            </IcoBtn>
          </Dropdown>
        ]}
      />
    );
  };

  onRowClick = row => {
    trigger.call(this, 'onRowClick', row);
  };

  closePerformGroupActionDialog = () => {
    this.props.setPerformGroupActionResponse([]);
  };

  changeGroupAction = groupAction => {
    const { selectedRecords, performGroupAction } = this.props;

    if (groupAction.formKey) {
      FormManager.openFormModal({
        record: '@',
        formKey: groupAction.formKey,
        saveOnSubmit: false,
        onSubmit: rec => {
          let action = cloneDeep(groupAction);
          action.params = action.params || {};
          action.params.attributes = rec.getAttributesToSave();
          performGroupAction({ groupAction: action, selected: selectedRecords });
        }
      });
    } else {
      performGroupAction({ groupAction, selected: selectedRecords });
    }
  };

  onDelete = () => null;

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  showDeleteRecordsDialog = () => {
    this.setState({ isDialogShow: true });
    this.onDelete = this.deleteRecords;
  };

  renderPerformGroupActionResponse = performGroupActionResponse => {
    const { className } = this.props;
    const performGroupActionResponseUrl = (performGroupActionResponse[0] || {}).url;

    return (
      <EmptyGrid maxItems={performGroupActionResponse.length}>
        {performGroupActionResponseUrl ? (
          <Grid
            className={className}
            keyField={'link'}
            data={[
              {
                status: t('group-action.label.report'),
                link: performGroupActionResponseUrl
              }
            ]}
            columns={[
              {
                dataField: 'status',
                text: t('group-action.label.status')
              },
              {
                dataField: 'link',
                text: t('actions.document.download'),
                formatExtraData: {
                  formatter: ({ cell }) => {
                    const html = `<a href="${PROXY_URI + cell}" onclick="event.stopPropagation()">${t('actions.document.download')}</a>`;
                    return <span dangerouslySetInnerHTML={{ __html: html }} />;
                  }
                }
              }
            ]}
          />
        ) : (
          <Grid
            className={className}
            keyField={'nodeRef'}
            data={performGroupActionResponse}
            columns={[
              {
                dataField: 'title',
                text: t('group-action.label.record')
              },
              {
                dataField: 'status',
                text: t('group-action.label.status')
              },
              {
                dataField: 'message',
                text: t('group-action.label.message')
              }
            ]}
          />
        )}
      </EmptyGrid>
    );
  };

  onScrolling = e => {
    this.scrollPosition = e;
    this.hideGridInlineToolSettings();
  };

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
        pagination: { maxItems },
        groupBy,
        total
      },
      doInlineToolsOnRowClick = false,
      performGroupActionResponse,
      doNotCount,
      minHeight,
      journalConfig: { params = {} }
    } = this.props;

    let editable = true;

    if ((groupBy && groupBy.length) || params.disableTableEditing) {
      editable = false;
    }

    const HeightCalculation = ({ doNotCount, children, maxItems, minHeight, total }) => {
      if (doNotCount) {
        return <div style={{ height: minHeight }}>{children}</div>;
      }

      let rowsNumber = total > maxItems ? maxItems : total;
      if (rowsNumber < 1) {
        rowsNumber = 1;
      }

      return <EmptyGrid maxItems={rowsNumber}>{children}</EmptyGrid>;
    };

    return (
      <>
        <div className="ecos-journal-dashlet__grid">
          <HeightCalculation maxItems={maxItems} doNotCount={doNotCount} minHeight={minHeight} total={total}>
            {loading ? (
              <Loader />
            ) : (
              <Grid
                data={data}
                columns={columns}
                className={className}
                freezeCheckboxes
                filterable
                editable={editable}
                multiSelectable
                sortBy={sortBy}
                changeTrOptionsByRowClick={doInlineToolsOnRowClick}
                filters={this.filters}
                inlineTools={this.inlineTools}
                tools={this.renderTools}
                onSort={this.onSort}
                onFilter={this.onFilter}
                onSelect={this.setSelectedRecords}
                onRowClick={doInlineToolsOnRowClick && this.onRowClick}
                onMouseLeave={!doInlineToolsOnRowClick && this.hideGridInlineToolSettings}
                onChangeTrOptions={this.showGridInlineToolSettings}
                onScrolling={this.onScrolling}
                onEdit={saveRecords}
                selected={selectedRecords}
                selectAll={selectAllRecords}
                minHeight={minHeight}
                scrollPosition={this.scrollPosition}
              />
            )}
          </HeightCalculation>
        </div>

        <EcosModal
          title={t('group-action.label.header')}
          isOpen={Boolean(performGroupActionResponse.length)}
          hideModal={this.closePerformGroupActionDialog}
          className="journal__dialog"
        >
          {this.renderPerformGroupActionResponse(performGroupActionResponse)}
        </EcosModal>

        <RemoveDialog
          isOpen={this.state.isDialogShow}
          title={t('journals.action.delete-records-msg')}
          text={t('journals.action.remove-records-msg')}
          onDelete={this.onDelete}
          onCancel={this.closeDialog}
          onClose={this.closeDialog}
        />
      </>
    );
  }
}

JournalsDashletGrid.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  toolsClassName: PropTypes.string,
  minHeight: PropTypes.any,

  doInlineToolsOnRowClick: PropTypes.bool,
  doNotCount: PropTypes.bool,
  isWidget: PropTypes.bool
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
