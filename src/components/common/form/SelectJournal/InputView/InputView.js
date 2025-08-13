import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Tooltip } from '../../../../common';
import { Btn, IcoBtn } from '../../../../common/btns';
import { Grid } from '../../../../common/grid';
import InlineToolsDisconnected from '../../../grid/InlineTools/InlineToolsDisconnected';
import { AssocLink } from '../../AssocLink';
import CreateVariants from '../CreateVariants';
import { Labels } from '../constants';

import Records from '@/components/Records/Records';
import RecordActions from '@/components/Records/actions/recordActions';
import { getFormattedLink, getFormatter } from '@/components/common/form/SelectJournal/helpers';
import { getEnabledWorkspaces, getMLValue, t } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

import './InputView.scss';

class InputView extends Component {
  #toolsRef = React.createRef();

  state = {
    aditionalButtons: [],
    createVariants: [],
    inlineToolsOffsets: { row: {} },
    targetId: uniqueId('SelectJournal')
  };

  gridWrapperRef = null;
  stopBlur = false;

  componentDidMount() {
    const { createVariants } = this.state;

    if (this.props.enableCreateButton && createVariants.length === 0) {
      this.fetchCreateVariants().then(variants => {
        this.setState({ createVariants: variants });
      });
    }
  }

  componentDidUpdate(prevProps, _prevState) {
    const { customActionRefs, selectedRows } = this.props;

    if (!isEmpty(customActionRefs) && prevProps.selectedRows !== selectedRows) {
      this.fetchActionButtons(selectedRows.map(row => row.id));
    }
  }

  componentWillUnmount() {
    if (this.gridWrapperRef) {
      this.gridWrapperRef.removeEventListener('mouseleave', this.resetInlineToolsOffsets);
    }
  }

  setRef = ref => {
    if (ref) {
      this.gridWrapperRef = ref;
      this.gridWrapperRef.addEventListener('mouseleave', this.resetInlineToolsOffsets);
    }
  };

  resetInlineToolsOffsets = () => {
    this.setState({ inlineToolsOffsets: { row: {} } });
  };

  onBlur = () => {
    const { onBlur } = this.props;

    if (!this.stopBlur && typeof onBlur === 'function') {
      onBlur.call(this);
    }
  };

  onClick = () => {
    const { openSelectModal } = this.props;

    if (typeof openSelectModal === 'function') {
      this.stopBlur = true;
      openSelectModal.call(this);
    }
  };

  onCustomActionClick = async (recordRef, action) => {
    try {
      await RecordActions.execForRecord(recordRef, action);
    } catch (e) {
      console.error(`Exception while execForRecord. RecordRef: ${recordRef}, Action: ${action}`, e);

      NotificationManager.error(t('journals.formatter.action.execution-error'));
    }
  };

  fetchCreateVariants = async () => {
    const { journalId } = this.props;
    const recordRef = `uiserv/rjournal@${journalId}`;

    try {
      const variants = (await Records.get(recordRef).load('createVariants[]?json', true)) || [];

      return variants.map(variant => ({
        ...variant,
        title: getMLValue(variant.name)
      }));
    } catch (e) {
      console.error(`Error during loading journals(${journalId}) create variants`, e);

      return [];
    }
  };

  fetchActionButtons = records => {
    const onCreate = this.props.onCreate;
    const refs = this.props.customActionRefs;
    const options = {
      newBrowserTab: this.props.isModalMode,
      onRecordCreated: onCreate
    };

    RecordActions.getActionsForRecords(records, refs, options)
      .then(({ forRecord }) => {
        if (!isEmpty(forRecord)) {
          this.setState({ aditionalButtons: forRecord });
        }
      })
      .catch(e => {
        console.error(`Error during loading action buttons(${refs.join(',')})`, e);
      });
  };

  isNewOffsets = offsets => {
    const { inlineToolsOffsets } = this.state;

    if (!offsets || !inlineToolsOffsets) {
      return false;
    }

    let isDifferentData = false;

    if (offsets.row.id !== inlineToolsOffsets.rowId) {
      isDifferentData = true;
    }

    return isDifferentData;
  };

  setInlineToolsOffsets = offsets => {
    if (this.isNewOffsets(offsets)) {
      this.setState({
        inlineToolsOffsets: {
          rowId: offsets.row.id || null
        }
      });
    }
  };

  renderSelectedValue(item) {
    const { isSelectedValueAsText, isModalMode, linkFormatter } = this.props;
    const enabledWorkspaces = getEnabledWorkspaces();

    const formatterFunc = getFormatter(linkFormatter);

    const props = {};

    if (!isSelectedValueAsText) {
      const link = getFormattedLink({ item, formatterFunc });

      props.link = link;
      props.paramsLink = { openNewBrowserTab: isModalMode };

      const newUrl = new URL(link, window.location.origin);
      const searchParams = new URLSearchParams(newUrl.search);

      if (enabledWorkspaces) {
        props.paramsLink = {
          ...props.paramsLink,
          workspaceId: searchParams.get('ws')
        };
      }
    }

    return <AssocLink label={item.disp} asText={isSelectedValueAsText} {...props} className="select-journal__values-list-disp" />;
  }

  renderCompactList = () => {
    const { selectedRows, isCompact } = this.props;
    const { targetId } = this.state;

    if (!isCompact || isEmpty(selectedRows)) {
      return null;
    }

    const compactValue = selectedRows.map(item => item.disp).join(', ');

    return (
      <Tooltip showAsNeeded target={targetId} uncontrolled text={compactValue} className="select-journal__values-list-tooltip">
        <div id={targetId} className="select-journal__values-list_compact">
          {compactValue}
        </div>
      </Tooltip>
    );
  };

  renderInlineTools = () => {
    const { editValue, deleteValue, selectedRows, hideEditRowButton, hideDeleteRowButton } = this.props;
    const { inlineToolsOffsets } = this.state;
    const inlineToolsActionClassName =
      'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_hover_t-dark-brown ecos-btn_x-step_10 ecos-inline-tools-btn';
    const iconButtons = [];
    const row = selectedRows.find(row => row.id === inlineToolsOffsets.rowId);

    if (row && !(!row.canEdit || hideEditRowButton)) {
      iconButtons.push(
        <IcoBtn
          key={'edit'}
          icon={'icon-edit'}
          className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__edit')}
          onClick={() => editValue(row.id)}
        />
      );
    }

    if (row && !hideDeleteRowButton) {
      iconButtons.push(
        <IcoBtn
          key={'delete'}
          icon={'icon-delete'}
          className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__delete')}
          onClick={() => deleteValue(row.id)}
        />
      );
    }

    return (
      <InlineToolsDisconnected forwardedRef={this.#toolsRef} selectedRecords={selectedRows} {...inlineToolsOffsets} tools={iconButtons} />
    );
  };

  renderList = () => {
    const {
      viewMode,
      disabled,
      isCompact,
      editValue,
      placeholder,
      viewOnly,
      deleteValue,
      selectedRows,
      hideEditRowButton,
      hideDeleteRowButton,
      gridData,
      selectedQueryInfo
    } = this.props;

    const { aditionalButtons } = this.state;

    if (isCompact) {
      return null;
    }

    if (selectedQueryInfo) {
      return (
        <div className="select-journal__value-selection">
          <div>{selectedQueryInfo}</div>
          {!disabled && (
            <div className="select-journal__values-list-actions">
              {!isEmpty(aditionalButtons[selectedQueryInfo.id]) &&
                aditionalButtons[selectedQueryInfo.id].map(button => (
                  <span
                    key={button.id}
                    data-id={button.id}
                    className={`icon ${button.icon}`}
                    onClick={() => this.onCustomActionClick(selectedQueryInfo.id, button)}
                  />
                ))}
              {!hideDeleteRowButton && <span className="icon icon-delete" onClick={deleteValue} />}
            </div>
          )}
        </div>
      );
    }

    if (isEmpty(selectedRows)) {
      return (
        <p className={classNames('select-journal__value-not-selected', { 'select-journal__value-not-selected_view-only': viewOnly })}>
          {placeholder || t(Labels.PLACEHOLDER)}
        </p>
      );
    }

    if (viewMode === 'table') {
      return (
        <div ref={this.setRef} className="mb-3">
          <Grid
            {...gridData}
            autoHeight
            byContentHeight
            scrollable
            inlineTools={this.renderInlineTools}
            onChangeTrOptions={this.setInlineToolsOffsets}
          />
        </div>
      );
    }

    return (
      <ul className="select-journal__values-list">
        {selectedRows.map(item => (
          <li key={item.id}>
            {this.renderSelectedValue(item)}

            {!disabled && (
              <div className="select-journal__values-list-actions">
                {!isEmpty(aditionalButtons[item.id]) &&
                  aditionalButtons[item.id].map(button => (
                    <span
                      key={button.id}
                      data-id={button.id}
                      className={`icon ${button.icon}`}
                      onClick={() => this.onCustomActionClick(item.id, button)}
                    />
                  ))}
                {!(!item.canEdit || hideEditRowButton) && (
                  <span data-id={item.id} className="icon icon-edit" onClick={() => editValue(item.id)} />
                )}
                {!hideDeleteRowButton && <span data-id={item.id} className="icon icon-delete" onClick={() => deleteValue(item.id)} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  renderActionButton() {
    const { selectedRows, error, disabled, multiple, isCompact, autoFocus, hideActionButton } = this.props;

    if (error || hideActionButton) {
      return null;
    }

    return (
      <Btn
        className={classNames('ecos-btn_blue ecos-btn_narrow', {
          'select-journal__input-view-button_compact': isCompact
        })}
        onClick={this.onClick}
        disabled={disabled}
        autoFocus={autoFocus}
        onBlur={this.onBlur}
      >
        {isEmpty(selectedRows) ? t(Labels.INPUT_BTN_SELECT) : multiple ? t(Labels.INPUT_BTN_ADD) : t(Labels.INPUT_BTN_CHANGE)}
      </Btn>
    );
  }

  renderCustomButtons() {
    const { onCreate } = this.props;
    const { createVariants } = this.state;

    if (createVariants.length > 0) {
      return <CreateVariants items={createVariants} onCreateFormSubmit={onCreate} />;
    }

    return null;
  }

  render() {
    const { error, isCompact, className } = this.props;
    const wrapperClasses = classNames('select-journal__input-view', { 'select-journal__input-view_compact': isCompact }, className);

    return (
      <div className={wrapperClasses}>
        {this.renderList()}

        {error && <p className="select-journal__error">{error.message}</p>}

        <div className="select-journal__actions">
          {this.renderActionButton()}
          {this.renderCustomButtons()}
        </div>

        {this.renderCompactList()}
      </div>
    );
  }
}

InputView.propTypes = {
  journalId: PropTypes.string.isRequired,
  selectedRows: PropTypes.array,
  placeholder: PropTypes.string,
  viewMode: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  enableCreateButton: PropTypes.bool,
  hideActionButton: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func,
  onCreate: PropTypes.func,
  hideEditRowButton: PropTypes.bool,
  hideDeleteRowButton: PropTypes.bool,
  customActionRefs: PropTypes.array,
  isSelectedValueAsText: PropTypes.bool,
  isInlineEditingMode: PropTypes.bool,
  gridData: PropTypes.object,
  dataType: PropTypes.string
};

export default InputView;
