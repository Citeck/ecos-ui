import { connect } from 'react-redux';

import Models from './ModelComponent';

import { createModel, updateModels, savePagePosition } from '@/actions/dmn';
import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';
import RecordActions from '@/components/Records/actions/recordActions';
import { Labels } from '@/constants/commonDesigner';
import { EDITOR_PAGE_CONTEXT, LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME } from '@/constants/dmn';
import { t } from '@/helpers/export/util';
import { getLinkWithWs } from '@/helpers/urls';
import { getEnabledWorkspaces } from '@/helpers/util';
import { selectModelsByCategoryId } from '@/selectors/dmn';
import PageService from '@/services/PageService';
import { NotificationManager } from '@/services/notifications';

const OPEN_DMN_EDITOR_ACTION_REF = 'uiserv/action@open-dmn-editor';

const mapStateToProps = (state, props) => ({
  viewType: state.dmn.viewType,
  searchText: state.dmn.searchText,
  models: selectModelsByCategoryId(state, props),
  createModelCardLabel: t('designer.create-model-card.label')
});

const mapDispatchToProps = dispatch => ({
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
      RecordActions.getActionsForRecord(modelId, [OPEN_DMN_EDITOR_ACTION_REF]).then(actions => {
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
  onEditMetaClick: (e, modelId) => {
    e.preventDefault();
    EcosFormUtils.editRecord({
      recordRef: modelId,
      onSubmit: () => dispatch(updateModels())
    });
  },
  onDeleteModelClick: (e, modelId) => {
    e.preventDefault();
    RecordActions.execForRecord(modelId, {
      type: 'delete'
    }).then(res => {
      if (res) {
        dispatch(updateModels());
      }
    });
  },
  showModelCreationForm: categoryId => dispatch(createModel({ categoryId }))
});

export default connect(mapStateToProps, mapDispatchToProps)(Models);
