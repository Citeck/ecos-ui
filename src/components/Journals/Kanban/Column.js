import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/export/util';
import { InfoText } from '../../common';
import { Labels } from '../constants';
import Card from './Card';

class Column extends React.PureComponent {
  renderInfo = () => {
    const { records, isFirstLoading, error } = this.props;
    let text;

    if (error) {
      text = error;
    } else if (isFirstLoading) {
      text = ' ';
    } else if (isEmpty(records)) {
      text = t(Labels.KB_COL_NO_CARD);
    }

    if (!text) {
      return null;
    }

    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={text} noIndents />
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
          {this.renderInfo()}
        </div>
      </div>
    );
  }
}

export default Column;
