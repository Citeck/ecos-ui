import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/export/util';
import { InfoText } from '../../common';
import { Labels } from '../constants';
import Card from './Card';

class Column extends React.PureComponent {
  renderNoCard = noText => {
    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={noText ? '' : t(Labels.KB_COL_NO_CARD)} />
      </div>
    );
  };

  renderContentCard = (data, index) => {
    const { formProps, readOnly } = this.props;

    return <Card key={data.cardId} data={data} formProps={formProps} readOnly={readOnly} />;
  };

  render() {
    const { cards, isFirstLoading } = this.props;
    return (
      <div className="ecos-kanban__column">
        <div className="ecos-kanban__column-card-list">
          {isEmpty(cards) ? this.renderNoCard(isFirstLoading) : cards.map(this.renderContentCard)}
        </div>
      </div>
    );
  }
}

export default Column;
