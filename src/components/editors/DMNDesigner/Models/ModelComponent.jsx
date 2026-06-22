import { ViewTypes } from '@citeck/constants/commonDesigner';
import moment from 'moment';
import React from 'react';
import { Row } from 'reactstrap';

import CreateModelCard from '@/components/editors/DesignerCommon/CreateModelCard';
import ModelCard from '@/components/editors/DesignerCommon/ModelCard';
import ModelList from '@/components/editors/DesignerCommon/ModelList';

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
