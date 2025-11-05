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
import MenuCreateVariants from '../CreateVariants/MenuCreateVariants';
import { Labels } from '../constants';

import Records from '@/components/Records/Records';
import DebugFormAction from '@/components/Records/actions/handler/executor/DebugFormAction';
import RecordActions from '@/components/Records/actions/recordActions';
import { getFormattedLink, getFormatter } from '@/components/common/form/SelectJournal/helpers';
import ChevronRight from '@/components/common/icons/ChevronRight';
import Close from '@/components/common/icons/Close';
import Debug from '@/components/common/icons/Debug';
import Edit from '@/components/common/icons/Edit';
import Subtract from '@/components/common/icons/Subtract';
import VerticalActions from '@/components/common/icons/VerticalActions';
import { getEnabledWorkspaces, getMLValue, t } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

import './InputView.scss';

class InputView extends Component {
  #toolsRef = React.createRef();
  menuRef = React.createRef();

  state = {
    aditionalButtons: [],
    createVariants: [],
    inlineToolsOffsets: { row: {} },
    targetId: uniqueId('SelectJournal'),
    isOpenMenuActions: false,
    isFlipped: false
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

    if (!this.props.multiple) {
      document.addEventListener('click', this.closeMenuActions);
    }
  }

  checkFlip() {
    const el = this.menuRef.current;
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const required = 200;
    const shouldFlip = spaceRight < required;
    if (shouldFlip !== this.state.isFlipped && !this.state.isFlipped) {
      this.setState({ isFlipped: shouldFlip });
    }
  }

  componentDidUpdate(prevProps, _prevState) {
    const { customActionRefs, selectedRows } = this.props;

    if (!isEmpty(customActionRefs) && prevProps.selectedRows !== selectedRows) {
      this.fetchActionButtons(selectedRows.map(row => row.id));
    }

    if (this.state.isOpenMenuActions && !_prevState.isOpenMenuActions) {
      this.checkFlip();
    }
  }

  componentWillUnmount() {
    if (this.gridWrapperRef) {
      this.gridWrapperRef.removeEventListener('mouseleave', this.resetInlineToolsOffsets);
    }

    if (!this.props.multiple) {
      document.removeEventListener('click', this.closeMenuActions);
    }
  }

  get textForModal() {
    const { selectedRows, multiple } = this.props;
    return isEmpty(selectedRows) ? t(Labels.INPUT_BTN_SELECT) : multiple ? t(Labels.INPUT_BTN_ADD) : t(Labels.INPUT_BTN_CHANGE);
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

  closeMenuActions = () => {
    this.setState({ isOpenMenuActions: false });
  };

  toggleIsOpenMenuActions = e => {
    if (e) {
      e.stopPropagation();
    }

    this.setState(state => ({ isOpenMenuActions: !state.isOpenMenuActions }));
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
          onClick={e => this.handleAction(e, () => deleteValue(row.id))}
        />
      );
    }

    return (
      <InlineToolsDisconnected forwardedRef={this.#toolsRef} selectedRecords={selectedRows} {...inlineToolsOffsets} tools={iconButtons} />
    );
  };

  handleAction = (e, callback) => {
    e.stopPropagation();
    callback && callback(e);
  };

  renderActionChoice = () => (
    <span
      className="select-journal__values-list-actions_item select-journal_action_open-modal"
      onClick={e => this.handleAction(e, this.onClick)}
      role="choice-control"
    >
      <ChevronRight width={14} height={14} />
    </span>
  );

  renderSimpleMenu = item => {
    const { onCreate } = this.props;
    const { aditionalButtons, isOpenMenuActions, createVariants, isFlipped } = this.state;

    return (
      <>
        {this.renderActionChoice()}
        {(!isEmpty(aditionalButtons[item.id]) || createVariants.length > 0) && (
          <span
            className={classNames('select-journal__values-list-actions_item', { active: isOpenMenuActions })}
            data-id={item.id}
            onClick={this.toggleIsOpenMenuActions}
            role="actions-control"
          >
            <VerticalActions width={14} height={14} />
            {isOpenMenuActions && (
              <ul ref={this.menuRef} className={classNames('select-journal__values-list-actions-menu', { flip: isFlipped })}>
                {createVariants.length > 0 && <MenuCreateVariants items={createVariants} onCreateFormSubmit={onCreate} />}

                {aditionalButtons[item.id].map(button => (
                  <li
                    key={button.id}
                    data-id={button.id}
                    onClick={e => this.handleAction(e, () => this.onCustomActionClick(item.id, button))}
                  >
                    {button.type === DebugFormAction.ACTION_ID ? <Debug /> : <span className={`icon ${button.icon}`} />}
                    <p>{button.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </span>
        )}
      </>
    );
  };

  renderList = () => {
    const {
      viewMode,
      disabled,
      multiple,
      editValue,
      placeholder,
      deleteValue,
      selectedRows,
      hideEditRowButton,
      hideDeleteRowButton,
      gridData,
      isCompact,
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
              {!hideDeleteRowButton && (
                <span className="icon icon-delete" role="cancel-control" onClick={e => this.handleAction(e, deleteValue)} />
              )}
            </div>
          )}
        </div>
      );
    }

    if (isEmpty(selectedRows) && !multiple) {
      return (
        <div className={classNames('select-journal__values-list', { multiple })} onClick={this.onClick}>
          <div className="select-journal__values-list_text-content">
            <span>{placeholder || t(Labels.PLACEHOLDER)}</span>
            {this.renderActionChoice()}
          </div>
        </div>
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
      <ul className={classNames('select-journal__values-list', { multiple, disabled })} onClick={this.onClick}>
        {selectedRows.map(item => (
          <li className="select-journal__values-list_text-content" key={item.id}>
            {this.renderSelectedValue(item)}

            {!disabled && (
              <div className="select-journal__values-list-actions">
                {!(!item.canEdit || hideEditRowButton) && multiple && (
                  <span
                    className="select-journal__values-list-actions_item"
                    data-id={item.id}
                    onClick={e => this.handleAction(e, () => editValue(item.id))}
                  >
                    <Edit width={14} height={14} />
                  </span>
                )}
                {!hideDeleteRowButton && (
                  <span
                    className="select-journal__values-list-actions_item"
                    data-id={item.id}
                    onClick={e => this.handleAction(e, () => deleteValue(item.id))}
                    role="cancel-control"
                  >
                    <Close width={14} height={14} />
                  </span>
                )}
                {!multiple && this.renderSimpleMenu(item)}
              </div>
            )}
          </li>
        ))}
        {!!multiple && !disabled && (
          <li onClick={e => this.handleAction(e, this.onClick)} role="choice-control" className="select-journal__values-list__action_add">
            <Subtract />
          </li>
        )}
      </ul>
    );
  };

  renderActionButton() {
    const { error, disabled, autoFocus, hideActionButton } = this.props;

    if (error || hideActionButton) {
      return null;
    }

    return (
      <Btn
        className={classNames('ecos-btn_blue ecos-btn_narrow')}
        onClick={this.onClick}
        disabled={disabled}
        autoFocus={autoFocus}
        onBlur={this.onBlur}
        role="choice-control"
      >
        {this.textForModal}
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
    const { error, className, isCompact } = this.props;
    const wrapperClasses = classNames('select-journal__input-view', { 'select-journal__input-view_compact': isCompact }, className);

    return (
      <div className={wrapperClasses}>
        {this.renderList()}

        {error && <p className="select-journal__error">{error.message}</p>}

        {isCompact && (
          <div className="select-journal__actions">
            {this.renderActionButton()}
            {this.renderCustomButtons()}
          </div>
        )}

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
