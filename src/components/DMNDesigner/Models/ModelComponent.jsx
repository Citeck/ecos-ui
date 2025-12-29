import React from 'react';
import { Row } from 'reactstrap';
import moment from 'moment';

import ModelList from '../../designerCommon/ModelList';
import ModelCard from '../../designerCommon/ModelCard';
import CreateModelCard from '../../designerCommon/CreateModelCard';
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
  createModelCardLabel,
  canEditDef,
  canCreateDef
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
          sectionCode={model.sectionCode}
          author={model.creator}
          datetime={moment(model.created).calendar()}
          image={model.previewUrl}
          definition={model.definition}
          canEditDef={canEditDef}
        />
      ))}
      {viewType === ViewTypes.CARDS && !models.length && !searchText && canCreateDef && (
        <CreateModelCard showModelCreationForm={showModelCreationForm} label={createModelCardLabel} categoryId={categoryId} />
      )}
    </Row>
  );
};

export default Models;
