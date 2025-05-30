import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { AssocLink } from '../../AssocLink';
import InputView from '../InputView';
import { Labels } from '../constants';

import { DisplayModes } from '@/forms/components/custom/selectJournal/constants';
import { createDocumentUrl, getSelectedValueLink, getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces, t } from '@/helpers/util';

import './ViewMode.scss';

class ViewMode extends Component {
  renderTableView() {
    return <InputView {...this.props} hideActionButton />;
  }

  render() {
    const { selectedRows, selectedQueryInfo, placeholder, isSelectedValueAsText, linkFormatter } = this.props;
    const currentWorkspaceId = getWorkspaceId();
    const enabledWorkspaces = getEnabledWorkspaces();

    let formatterFunc = null;
    if (linkFormatter && typeof linkFormatter === 'string') {
      try {
        formatterFunc = eval(`(${linkFormatter})`);
      } catch (err) {
        console.error('[SelectJournal] Error when parsing the link Formatter:', err);
      }
    }

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
              let link = getSelectedValueLink(item);
              if (formatterFunc) {
                try {
                  link = formatterFunc(link);
                } catch (err) {
                  console.error('[SelectJournal] Error in linkFormatter method:', err);
                }
              } else {
                link = createDocumentUrl(link);
              }

              props.link = link;
              props.paramsLink = { openNewBrowserTab: false };

              const newUrl = new URL(link, window.location.origin);
              const searchParams = new URLSearchParams(newUrl.search);

              if (enabledWorkspaces && currentWorkspaceId !== searchParams.get('ws')) {
                props.paramsLink = {
                  ...props.paramsLink,
                  workspaceId: searchParams.get('ws')
                };
              }
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
  openSelectModal: PropTypes.func,
  linkFormatter: PropTypes.string
};

export default ViewMode;
