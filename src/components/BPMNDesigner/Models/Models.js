import { connect } from 'react-redux';

import Models from '../../designerCommon/Models';

import { createModel, getFullModels, getNextModels, initModels, savePagePosition, updateModels } from '@/actions/bpmn';
import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';
import RecordActions from '@/components/Records/actions/recordActions';
import { EDITOR_PAGE_CONTEXT, LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME } from '@/constants/bpmn';
import { Labels } from '@/constants/commonDesigner';
import { t } from '@/helpers/export/util';
import { getLinkWithWs } from '@/helpers/urls';
import { getEnabledWorkspaces } from '@/helpers/util';
import { selectModelsInfoByCategoryId } from '@/selectors/bpmn';
import PageService from '@/services/PageService';
import { NotificationManager } from '@/services/notifications';

const OPEN_BPMN_EDITOR_ACTION_REF = 'uiserv/action@open-bpmn-editor';

const mapStateToProps = (state, props) => ({
  viewType: state.bpmn.viewType,
  searchText: state.bpmn.searchText,
  modelsInfo: selectModelsInfoByCategoryId(state, props),
  createModelCardLabel: t('designer.create-model-card.label'),
  canEditDef: props.canEditDef,
  canCreateDef: props.canCreateDef,
  isCategoryOpen: props.isCategoryOpen
});

const mapDispatchToProps = dispatch => ({
  initModels: categoryId => dispatch(initModels({ categoryId })),
  getNextModels: categoryId => dispatch(getNextModels({ categoryId })),
  getFullModels: categoryId => dispatch(getFullModels({ categoryId })),
  onViewLinkClick: e => {
    e.preventDefault();

    dispatch(
      savePagePosition({
        callback: () => {
          PageService.changeUrlLink(e.currentTarget.href, {
            openNewTab: true
          });
        }
      })
    );
  },
  onEditLinkClick: (e, modelId) => {
    e.preventDefault();

    if (modelId.indexOf('alfresco') === 0) {
      const itemNodeRef = modelId.replace('alfresco/@', '');
      const recordId = itemNodeRef.replace('workspace://SpacesStore/', '');
      const flowableEditLink = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;

      dispatch(
        savePagePosition({
          callback: () => {
            localStorage.setItem(LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME, window.location.pathname);
            window.location.href = flowableEditLink;
          }
        })
      );
    } else {
      RecordActions.getActionsForRecord(modelId, [OPEN_BPMN_EDITOR_ACTION_REF]).then(actions => {
        if (!actions || !actions.length) {
          NotificationManager.error(t(Labels.ACTION_OPEN_PROC_EDITOR_ERROR), t('error'));
        } else {
          let action = actions[0];

          if (action && action.config && action.config.url && getEnabledWorkspaces()) {
            action.config.url = getLinkWithWs(action.config.url);
          }

          return RecordActions.execForRecord(modelId, action);
        }
      });
    }
  },
  onEditMetaClick: (e, modelId, model) => {
    e.preventDefault();
    EcosFormUtils.editRecord({
      recordRef: modelId,
      onSubmit: resultModel =>
        dispatch(updateModels({ modelId, resultModelId: resultModel.id, prevCategoryId: model.categoryId, action: 'edit' }))
    });
  },
  onDeleteModelClick: (e, modelId, model) => {
    e.preventDefault();
    RecordActions.execForRecord(modelId, {
      type: 'delete'
    }).then(res => {
      if (res) {
        dispatch(updateModels({ modelId, prevCategoryId: model.categoryId, action: 'delete' }));
      }
    });
  },
  showModelCreationForm: categoryId => dispatch(createModel({ categoryId }))
});

export default connect(mapStateToProps, mapDispatchToProps)(Models);
