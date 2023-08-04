import { connect } from 'react-redux';
import { t } from '../../../helpers/util';
import Category from '../../designerCommon/DesignerCategory';

import {
  cancelEditCategory,
  createCategory,
  deleteCategoryRequest,
  saveCategoryRequest,
  setIsCategoryOpen,
  setIsEditable,
  createModel
} from '../../../actions/dmn';
import { hideModal, showModal } from '../../../actions/modal';
import { savePagePosition } from '../../../actions/dmn';

const mapStateToProps = state => ({
  viewType: state.dmn.viewType,
  searchText: state.dmn.searchText
});

const mapDispatchToProps = (dispatch, props) => ({
  setIsEditable: () => dispatch(setIsEditable(props.categoryId)),
  toggleCollapse: () => {
    dispatch(setIsCategoryOpen({ id: props.categoryId, isOpen: !props.isOpen }));
    dispatch(savePagePosition());
  },
  setCollapse: isOpen => {
    dispatch(setIsCategoryOpen({ id: props.categoryId, isOpen }));
    dispatch(savePagePosition());
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
              dispatch(deleteCategoryRequest(props.categoryId));
              dispatch(hideModal());
            },
            className: 'button_red'
          }
        ]
      })
    );
  },
  createCategory: () => dispatch(createCategory({ parentId: props.categoryId })),
  createModel: () => dispatch(createModel({ categoryId: props.categoryId })),
  saveEditableCategory: text => dispatch(saveCategoryRequest({ id: props.categoryId, label: text })),
  cancelEditCategory: () => dispatch(cancelEditCategory(props.categoryId))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Category);
