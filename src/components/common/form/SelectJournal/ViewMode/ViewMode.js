import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl, getSelectedValueLink } from '../../../../../helpers/urls';
import { DisplayModes } from '../../../../../forms/components/custom/selectJournal/constants';
import { AssocLink } from '../../AssocLink';
import { Labels } from '../constants';
import InputView from '../InputView';

import './ViewMode.scss';

class ViewMode extends Component {
  renderTableView() {
    return <InputView {...this.props} hideActionButton />;
  }

  render() {
    const { selectedRows, selectedQueryInfo, placeholder, isSelectedValueAsText } = this.props;

    if (selectedQueryInfo) {
      return <p>{selectedQueryInfo}</p>;
    }

    if (this.props.viewMode === DisplayModes.TABLE) {
      return this.renderTableView();
    }

    if (!isEmpty(selectedRows)) {
      return (
        <ul className="select-journal-view-mode__list">
          {selectedRows.map(item => {
            const props = {};

            if (!isSelectedValueAsText) {
              props.link = createDocumentUrl(getSelectedValueLink(item));
              props.paramsLink = { openNewBrowserTab: false };
            }

            return (
              <li key={item.id}>
                <AssocLink label={item.disp} asText={isSelectedValueAsText} className="select-journal-view-mode__list-value" {...props} />
              </li>
            );
          })}
        </ul>
      );
    }

    return <p>{placeholder || t(Labels.PLACEHOLDER)}</p>;
  }
}

ViewMode.propTypes = {
  selectedRows: PropTypes.array,
  placeholder: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func
};

export default ViewMode;
