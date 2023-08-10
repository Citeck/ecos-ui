import { connect } from 'react-redux';
import { t } from '../../../helpers/util';
import Category from '../../designerCommon/DesignerCategory';
import { REMOVE_DIALOG_ID } from '../../common/dialogs/Manager/DialogManager';
import {
  cancelEditCategory,
  createCategory,
  deleteCategoryRequest,
  saveCategoryRequest,
  setIsCategoryOpen,
  setIsEditable,
  createModel
} from '../../../actions/dmn';
import { showModal } from '../../../actions/modal';
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
        dialogId: REMOVE_DIALOG_ID,
        title: t('designer.delete-category-dialog.title'),
        text: t('designer.delete-category-dialog.text'),
        onSubmit: () => {
          dispatch(deleteCategoryRequest(props.categoryId));
        }
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
