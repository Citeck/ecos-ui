import { connect } from 'react-redux';
import { NotificationManager } from '@/services/notifications';

import { createModel, updateModels, savePagePosition } from '../../../actions/dmn';
import { selectModelsByCategoryId } from '../../../selectors/dmn';
import { t } from '../../../helpers/export/util';
import Models from './ModelComponent';
import recordActions from '../../../components/Records/actions/recordActions';

import EcosFormUtils from '../../../components/EcosForm/EcosFormUtils';

import RecordActions from '../../../components/Records/actions/recordActions';
import PageService from '../../../services/PageService';
import { Labels } from '../../../constants/commonDesigner';
import { EDITOR_PAGE_CONTEXT, LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME } from '../../../constants/dmn';

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
          return RecordActions.execForRecord(modelId, actions[0]);
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
    recordActions
      .execForRecord(modelId, {
        type: 'delete'
      })
      .then(res => {
        if (res) {
          dispatch(updateModels());
        }
      });
  },
  showModelCreationForm: categoryId => dispatch(createModel({ categoryId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Models);
