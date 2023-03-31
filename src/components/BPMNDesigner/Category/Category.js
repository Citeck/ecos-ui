import { connect } from 'react-redux';

import Category from '../../designerCommon/DesignerCategory';
import { t } from '../../../helpers/util';
import {
  cancelEditCategory,
  createCategory,
  deleteCategoryRequest,
  saveCategoryRequest,
  setCategoryCollapseState,
  setIsEditable,
  createModel
} from '../../../actions/bpmn';
import { hideModal, showModal } from '../../../actions/modal';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType,
  searchText: state.bpmn.searchText
});

const mapDispatchToProps = (dispatch, props) => ({
  setIsEditable: () => {
    dispatch(setIsEditable(props.itemId));
  },
  toggleCollapse: () => {
    dispatch(setCategoryCollapseState({ id: props.itemId, isOpen: !props.isOpen }));
  },
  setCollapse: isOpen => {
    dispatch(setCategoryCollapseState({ id: props.itemId, isOpen }));
  },
  showDeleteCategoryModal: () => {
    dispatch(
      showModal({
        title: t('designer.delete-category-dialog.title'),
        content: t('designer.delete-category-dialog.text'),
        buttons: [
          {
            label: t('designer.delete-category-dialog.cancel-btn'),
            isCloseButton: true
          },
          {
            label: t('designer.delete-category-dialog.delete-btn'),
            onClick: () => {
              dispatch(deleteCategoryRequest(props.itemId));
              dispatch(hideModal());
            },
            className: 'button_red'
          }
        ]
      })
    );
  },
  createCategory: () => {
    dispatch(createCategory({ parentId: props.itemId }));
  },
  createModel: () => {
    dispatch(createModel({ categoryId: props.itemId }));
  },
  saveEditableCategory: text => {
    dispatch(saveCategoryRequest({ id: props.itemId, label: text }));
  },
  cancelEditCategory: text => {
    dispatch(cancelEditCategory(props.itemId));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Category);
