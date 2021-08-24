import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/export/util';
import { InfoText } from '../../common';
import { Labels } from '../constants';
import Card from './Card';

class Column extends React.PureComponent {
  renderTipCard = () => {
    const { records, isFirstLoading, error } = this.props;
    let text;

    if (error) {
      text = error;
    } else if (!isFirstLoading && isEmpty(records)) {
      text = t(Labels.KB_COL_NO_CARD);
    }

    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={text} />
      </div>
    );
  };

  renderContentCard = (record, index) => {
    const { formProps, readOnly } = this.props;

    return <Card key={record.cardId} data={record} formProps={formProps} readOnly={readOnly} />;
  };

  render() {
    const { records = [] } = this.props;

    return (
      <div className="ecos-kanban__column">
        <div className="ecos-kanban__column-card-list">
          {records.map(this.renderContentCard)}
          {this.renderTipCard()}
        </div>
      </div>
    );
  }
}

export default Column;
