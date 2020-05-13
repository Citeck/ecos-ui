import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl } from '../../../../../helpers/urls';
import { Btn, IcoBtn } from '../../../../common/btns';
import InlineToolsDisconnected from '../../../grid/InlineTools/InlineToolsDisconnected';
import { Grid } from '../../../../common/grid';
import { AssocLink } from '../../AssocLink';

import './InputView.scss';

class InputView extends Component {
  state = {
    inlineToolsOffsets: { height: 0, top: 0, row: {} }
  };

  gridWrapperRef = null;
  stopBlur = false;

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
    this.setState({ inlineToolsOffsets: { height: 0, top: 0, row: {} } });
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
    const { isSelectedValueAsText, isInlineEditingMode } = this.props;
    const props = {};

    if (!isSelectedValueAsText) {
      props.link = createDocumentUrl(item.id);
      props.paramsLink = { openNewBrowserTab: !isInlineEditingMode };
    }

    return <AssocLink label={item.disp} asText={isSelectedValueAsText} {...props} className="select-journal__values-list-disp" />;
  }

  renderCompactList = () => {
    const { selectedRows, isCompact } = this.props;

    if (!isCompact) {
      return null;
    }

    return (
      <>
        {selectedRows.length > 0 && (
          <div className="select-journal__values-list_compact">{selectedRows.map(item => item.disp).join(', ')}</div>
        )}
      </>
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

    return <InlineToolsDisconnected selectedRecords={selectedRows} {...inlineToolsOffsets} tools={iconButtons} />;
  };

  renderList = () => {
    const {
      viewMode,
      disabled,
      isCompact,
      editValue,
      placeholder,
      deleteValue,
      selectedRows,
      hideEditRowButton,
      hideDeleteRowButton,
      gridData
    } = this.props;

    if (isCompact) {
      return null;
    }

    if (!selectedRows.length) {
      return <p className="select-journal__value-not-selected">{placeholder ? placeholder : t('select-journal.placeholder')}</p>;
    }

    if (viewMode === 'table') {
      return (
        <div ref={this.setRef} className="mb-3">
          <Grid {...gridData} inlineTools={this.renderInlineTools} onChangeTrOptions={this.setInlineToolsOffsets} />
        </div>
      );
    }

    return (
      <ul className="select-journal__values-list">
        {selectedRows.map(item => (
          <li key={item.id}>
            {this.renderSelectedValue(item)}
            {disabled ? null : (
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

  render() {
    const { selectedRows, error, disabled, multiple, isCompact, className, autoFocus } = this.props;
    const wrapperClasses = classNames('select-journal__input-view', { 'select-journal__input-view_compact': isCompact }, className);
    const buttonClasses = classNames('ecos-btn_blue ecos-btn_narrow', {
      'select-journal__input-view-button_compact': isCompact
    });

    return (
      <div className={wrapperClasses}>
        {this.renderList()}

        {error ? (
          <p className="select-journal__error">{error.message}</p>
        ) : (
          <Btn className={buttonClasses} onClick={this.onClick} disabled={disabled} autoFocus={autoFocus} onBlur={this.onBlur}>
            {selectedRows.length > 0
              ? multiple
                ? t('select-journal.button.add')
                : t('select-journal.button.change')
              : t('select-journal.button.select')}
          </Btn>
        )}

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
  isSelectedValueAsText: PropTypes.bool,
  isInlineEditingMode: PropTypes.bool
};

export default InputView;
