import React, { Component } from 'react';

import Filters from '../../Filters/Filters';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t } from '../../../helpers/util';
import { selectFilterGroup } from '../../../selectors/journals';

import './JournalsFilters.scss';

class JournalsFilters extends Component {
  onChangeFilters = predicate => {
    this.props.setPredicate(predicate);
  };

  render() {
    const { predicate, columns, sourceId, metaRecord, needUpdate } = this.props;

    return (
      <PanelBar header={t('filter-list.panel-header')} css={{ headerClassName: 'panel-bar__header_upper' }}>
        <Filters
          predicate={predicate}
          columns={columns}
          sourceId={sourceId}
          metaRecord={metaRecord}
          needUpdate={needUpdate}
          className="ecos-journals-filters"
          onChange={this.onChangeFilters}
          groups={selectFilterGroup(predicate, columns)}
        />
      </PanelBar>
    );
  }
}

export default JournalsFilters;
