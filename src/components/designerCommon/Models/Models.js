import React from 'react';
import { Row } from 'reactstrap';
import moment from 'moment';

import ModelList from '../ModelList';
import ModelCard from '../ModelCard';
import CreateModelCard from '../CreateModelCard';
import { ViewTypes } from '../../../constants/commonDesigner';

const Models = ({
  categoryId,
  models,
  searchText,
  viewType,
  onViewLinkClick,
  onEditLinkClick,
  onDeleteModelClick,
  onEditMetaClick,
  showModelCreationForm,
  createModelCardLabel
}) => {
  const ModelComponent = viewType === ViewTypes.LIST ? ModelList : ModelCard;

  return (
    <Row noGutters>
      {models.map(model => (
        <ModelComponent
          canWrite={model.canWrite}
          key={model.id}
          viewLink={`/v2/dashboard?recordRef=${model.id}`}
          onViewLinkClick={onViewLinkClick}
          onEditLinkClick={e => onEditLinkClick(e, model.id)}
          onDeleteModelClick={e => onDeleteModelClick(e, model.id)}
          onEditMetaClick={e => onEditMetaClick(e, model.id)}
          label={model.label}
          author={model.creator}
          datetime={moment(model.created).calendar()}
          image={model.previewUrl}
          definition={model.definition}
        />
      ))}
      {viewType === ViewTypes.CARDS && !models.length && !searchText && (
        <CreateModelCard showModelCreationForm={showModelCreationForm} label={createModelCardLabel} categoryId={categoryId} />
      )}
    </Row>
  );
};

export default Models;
