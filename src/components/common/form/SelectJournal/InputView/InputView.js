import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl } from '../../../../../helpers/urls';
import { Tooltip } from '../../../../common';
import { Btn, IcoBtn } from '../../../../common/btns';
import InlineToolsDisconnected from '../../../grid/InlineTools/InlineToolsDisconnected';
import { Grid } from '../../../../common/grid';
import { AssocLink } from '../../AssocLink';
import { Labels } from '../constants';

import './InputView.scss';

class InputView extends Component {
  #toolsRef = React.createRef();

  #scrollPosition = {};

  state = {
    inlineToolsOffsets: { height: 0, top: 0, row: {} },
    targetId: uniqueId('SelectJournal')
  };

  gridWrapperRef = null;
  stopBlur = false;

  componentWillUnmount() {
    if (this.gridWrapperRef) {
      this.gridWrapperRef.removeEventListener('mouseleave', this.resetInlineToolsOffsets);
    }

    this.#scrollPosition = {};
  }

  setRef = ref => {
    if (ref) {
      this.gridWrapperRef = ref;
      this.gridWrapperRef.addEventListener('mouseleave', this.resetInlineToolsOffsets);
    }
  };

  resetInlineToolsOffsets = () => {
    this.setState({ inlineToolsOffsets: { height: 0, top: 0, row: {} } });
  };

  onScrollingTable = event => {
    this.#scrollPosition = event;

    if (this.#toolsRef.current) {
      this.#toolsRef.current.style.left = `${event.scrollLeft}px`;
    }
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

  isNewOffsets = offsets => {
    const { inlineToolsOffsets } = this.state;

    if (!offsets || !inlineToolsOffsets) {
      return false;
    }

    let isDifferentData = false;

    if (offsets.height !== inlineToolsOffsets.height) {
      isDifferentData = true;
    }

    if (offsets.top !== inlineToolsOffsets.top) {
      isDifferentData = true;
    }

    if (offsets.row.id !== inlineToolsOffsets.rowId) {
      isDifferentData = true;
    }

    return isDifferentData;
  };

  setInlineToolsOffsets = offsets => {
    if (this.isNewOffsets(offsets)) {
      this.setState({
        inlineToolsOffsets: {
          height: offsets.height,
          top: offsets.top,
          rowId: offsets.row.id || null
        }
      });
    }
  };

  renderSelectedValue(item) {
    const { isSelectedValueAsText, isModalMode } = this.props;
    const props = {};

    if (!isSelectedValueAsText) {
      props.link = createDocumentUrl(item.id);
      props.paramsLink = { openNewBrowserTab: isModalMode };
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
      <InlineToolsDisconnected
        forwardedRef={this.#toolsRef}
        selectedRecords={selectedRows}
        {...inlineToolsOffsets}
        tools={iconButtons}
        left={this.#scrollPosition.scrollLeft}
      />
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

    if (isCompact) {
      return null;
    }

    if (selectedQueryInfo) {
      return (
        <div className="select-journal__value-selection">
          <div>{selectedQueryInfo}</div>
          {!disabled && (
            <div className="select-journal__values-list-actions">
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
            scrollPosition={this.#scrollPosition}
            inlineTools={this.renderInlineTools}
            onChangeTrOptions={this.setInlineToolsOffsets}
            onScrolling={this.onScrollingTable}
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

  render() {
    const { error, isCompact, className } = this.props;
    const wrapperClasses = classNames('select-journal__input-view', { 'select-journal__input-view_compact': isCompact }, className);

    return (
      <div className={wrapperClasses}>
        {this.renderList()}

        {error && <p className="select-journal__error">{error.message}</p>}

        {this.renderActionButton()}

        {this.renderCompactList()}
      </div>
    );
  }
}

InputView.propTypes = {
  selectedRows: PropTypes.array,
  placeholder: PropTypes.string,
  viewMode: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func,
  hideEditRowButton: PropTypes.bool,
  hideDeleteRowButton: PropTypes.bool,
  hideActionButton: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool,
  isInlineEditingMode: PropTypes.bool,
  gridData: PropTypes.object,
  dataType: PropTypes.string
};

export default InputView;
