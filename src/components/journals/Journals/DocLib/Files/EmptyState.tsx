import React from 'react';

import { IcoBtn } from '@/components/common/btns';
import { t } from '@/helpers/export/util';
import { selectDocLibCreateVariants, selectDocLibFileCanUploadFiles, selectDocLibSearchText } from '@/selectors/docLib';

import { DocLibLabels } from '../constants';
import { useCreateDialog } from '../hooks/useCreateDialog';
import { useDocLibSelector } from '../hooks/useDocLibSelector';
import { CreateVariant } from '../types';
import { EcosIcon } from '../ui';

interface EmptyStateProps {
  stateId: string;
}

const EmptyState = ({ stateId }: EmptyStateProps) => {
  const searchText = useDocLibSelector<string>(selectDocLibSearchText, stateId) || '';
  const canUpload = useDocLibSelector<boolean>(selectDocLibFileCanUploadFiles, stateId);
  const createVariants = useDocLibSelector<CreateVariant[]>(selectDocLibCreateVariants, stateId);
  const { openCreateForm } = useCreateDialog(stateId);

  const isSearch = !!searchText;

  return (
    <div className="citeck-doclib-empty">
      <div className="citeck-doclib-empty__icon">
        <EcosIcon data={{ value: isSearch ? 'icon-search' : 'icon-folder' }} />
      </div>
      <div className="citeck-doclib-empty__title">{t(isSearch ? DocLibLabels.SEARCH_NO_RESULTS : DocLibLabels.EMPTY_FOLDER)}</div>
      {!isSearch && canUpload && <div className="citeck-doclib-empty__hint">{t(DocLibLabels.EMPTY_HINT)}</div>}
      {!isSearch && createVariants.length === 1 && (
        <IcoBtn icon="icon-small-plus" className="citeck-doclib-empty__create-btn" onClick={() => openCreateForm(createVariants[0])}>
          {t(DocLibLabels.CREATE)}
        </IcoBtn>
      )}
    </div>
  );
};

export default EmptyState;
