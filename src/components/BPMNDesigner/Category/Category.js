import { connect } from 'react-redux';

import Category from '../../designerCommon/DesignerCategory';
import { t } from '../../../helpers/util';
import { REMOVE_DIALOG_ID } from '../../common/dialogs/Manager/DialogManager';
import {
  cancelEditCategory,
  createCategory,
  deleteCategoryRequest,
  saveCategoryRequest,
  setCategoryCollapseState,
  setIsEditable,
  createModel,
  savePagePosition
} from '../../../actions/bpmn';
import { showModal } from '../../../actions/modal';
import get from 'lodash/get';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType,
  searchText: state.bpmn.searchText,
  isUserAdmin: get(state, 'user.isAdmin', false)
});

const mapDispatchToProps = (dispatch, props) => ({
  setIsEditable: () => {
    dispatch(setIsEditable(props.itemId));
  },
  toggleCollapse: () => {
    dispatch(setCategoryCollapseState({ id: props.itemId, isOpen: !props.isOpen }));
    dispatch(savePagePosition());
  },
  setCollapse: isOpen => {
    dispatch(setCategoryCollapseState({ id: props.itemId, isOpen }));
    dispatch(savePagePosition());
  },
  showDeleteCategoryModal: () => {
    dispatch(
      showModal({
        dialogId: REMOVE_DIALOG_ID,
        title: t('designer.delete-category-dialog.title'),
        text: t('designer.delete-category-dialog.text'),
        onSubmit: () => {
          dispatch(deleteCategoryRequest(props.itemId));
        }
      })
    );
  },
  createCategory: () => {
    dispatch(createCategory({ parentId: props.itemId }));
  },
  createModel: () => {
    dispatch(createModel({ categoryId: props.itemId }));
  },
  saveEditableCategory: (code, mlText) => {
    dispatch(saveCategoryRequest({ id: props.itemId, code, label: mlText }));
  },
  cancelEditCategory: text => {
    dispatch(cancelEditCategory(props.itemId));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Category);
