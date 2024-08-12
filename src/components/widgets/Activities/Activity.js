import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment/moment';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import isNumber from 'lodash/isNumber';

import { Avatar, Loader } from '../../common/index';
import { t } from '../../../helpers/export/util';
import { Btn } from '../../common/btns';
import { Checkbox, Label, Select, DatePicker, SelectOrgstruct, Input } from '../../common/form';
import RichTextEditor from '../../RichTextEditor';
import { selectStateByRecordRef } from '../../../selectors/activities';
import { createActivityRequest, setError, deleteActivityRequest, getActivities, updateActivityRequest } from '../../../actions/activities';
import { Comment } from '../Comments/Comment';
import { ActivityTypes, optionsActivitySelect, IMMEDIATE_ACTIVITY, PLANNED_ACTIVITY } from '../../../constants/activity';
import { handleCloseMenuOnScroll } from '../../../helpers/util';
import isString from 'lodash/isString';

const DURATION_REGEX = /^(\d+h\s*)?(\d+m\s*)?$/;

export class Activity extends Comment {
  constructor(props) {
    super(props);

    this.state = {
      selectedType: null,
      responsible: null,
      performer: null,
      priority: null,
      initiator: null,
      activityDuration: null,
      activityDate: null,
      dueDate: null,
      titleAssignment: null
    };
  }

  get disabledEditor() {
    const {
      noChanges,
      selectedType,
      responsible,
      activityDate,
      activityDuration,
      titleAssignment,
      dueDate,
      priority,
      initiator,
      performer
    } = this.state;

    if (!this.canSendComment || noChanges || !(selectedType && selectedType.id)) {
      return true;
    }

    switch (selectedType.id) {
      case ActivityTypes.MEETING:
      case ActivityTypes.CALL:
      case ActivityTypes.EMAIL:
        return !responsible || !activityDate || !activityDuration || !this.validateDuration(activityDuration);

      case ActivityTypes.ASSIGNMENT:
        return !titleAssignment || !dueDate || !priority || !initiator || !performer;

      default:
        return false;
    }
  }

  handleSetState = (data, param = '') => {
    console.log('data:', data, 'param:', param);
    this.setState({ [param]: data });
  };

  handleChangeDate = (date, param = '') => {
    this.setState({ [param]: new Date(date).toISOString() });
  };

  handleChangeNumber = (event, min = 0, param = '') => {
    const val = event.target.value;
    if (val && val >= min) {
      this.setState({ [param]: val });
    }
  };

  handleChangeText = (e, param) => {
    const value = e.target.value;
    this.setState({ [param]: value });
  };

  validateDuration = value => {
    return DURATION_REGEX.test(value);
  };

  handleEditActivity = () => {
    const { comment = {} } = this.props;

    if (!isEmpty(comment)) {
      this.setState(
        {
          selectedType: comment.type,
          responsible: comment.responsible,
          performer: comment.performer,
          priority: comment.priority,
          initiator: comment.initiator,
          activityDuration: comment.activityDuration,
          activityDate: comment.activityDate,
          dueDate: comment.dueDate,
          titleAssignment: comment.title
        },
        () => this.handleEditComment()
      );
    } else {
      this.handleEditComment();
    }
  };

  handleSaveActivity = () => {
    if (get(this.props, 'saveIsLoading')) {
      return;
    }

    const { updateActivity, createActivity, comment, recordRef } = this.props;

    const text = this.handleTextBeforeSave();

    const callback = () => {
      this.handleCloseEditor();
      this.toggleLoading();
    };

    this.toggleLoading();

    console.log('this.state:', this.state);
    comment === null
      ? createActivity(recordRef, text, this.state, callback)
      : updateActivity(
          recordRef,
          {
            id: comment.id,
            text
          },
          this.state,
          callback
        );
  };

  renderSelect() {
    return (
      <Select
        value={this.state.selectedType}
        options={optionsActivitySelect}
        getOptionLabel={option => t(option.displayName)}
        getOptionValue={option => option.id}
        menuPortalTarget={document.body}
        menuPlacement="auto"
        closeMenuOnScroll={(e, { innerSelect }) => handleCloseMenuOnScroll(e, innerSelect)}
        onChange={select => this.handleSetState(select, 'selectedType')}
      />
    );
  }

  renderControlPanel() {
    const {
      selectedType,
      activityDate,
      activityDuration,
      titleAssignment,
      dueDate,
      priority,
      initiator,
      responsible,
      performer
    } = this.state;

    const typeId = get(selectedType, 'id', '');

    const selectedPerformer = isString(performer) ? performer : get(performer, 'authorityName', '');
    const selectedInitiator = isString(initiator) ? initiator : get(initiator, 'authorityName', '');
    const selectedResponsible = isString(responsible) ? responsible : get(responsible, 'authorityName', '');

    console.log('selectedInitiator:', selectedInitiator);
    switch (typeId) {
      case ActivityTypes.MEETING:
      case ActivityTypes.CALL:
      case ActivityTypes.EMAIL:
        return (
          <div className="ecos-activities__control-panel">
            {this.renderSelect()}
            <DatePicker
              showTimeSelect
              selected={activityDate}
              onChange={date => this.handleChangeDate(date, 'activityDate')}
              minDate={new Date()}
            />
            <SelectOrgstruct defaultValue={selectedResponsible} onChange={responsible => this.handleSetState(responsible, 'responsible')} />
            <Input
              value={activityDuration || ''}
              placeholder="0h 0m"
              onChange={e => this.handleChangeText(e, 'activityDuration')}
              type="text"
              isValid={this.validateDuration(activityDuration)}
              needValidCheck={true}
            />
          </div>
        );

      case ActivityTypes.ASSIGNMENT:
        return (
          <div className="ecos-activities__control-panel">
            {this.renderSelect()}
            <Input
              value={titleAssignment || ''}
              placeholder={t('activities-widget.fields.title')}
              onChange={e => this.handleChangeText(e, 'titleAssignment')}
            />
            <DatePicker selected={dueDate} showTimeSelect onChange={date => this.handleChangeDate(date, 'dueDate')} minDate={new Date()} />
            <Input
              min={0}
              value={priority || ''}
              placeholder={t('activities-widget.fields.priority')}
              onChange={e => this.handleChangeNumber(e, 0, 'priority')}
              type="number"
            />
            <div>
              <span>{t('activities-widget.fields.initiator')}</span>
              <SelectOrgstruct defaultValue={selectedInitiator} onChange={initiator => this.handleSetState(initiator, 'initiator')} />
            </div>
            <div>
              <span>{t('activities-widget.fields.performer')}</span>
              <SelectOrgstruct defaultValue={selectedPerformer} onChange={performer => this.handleSetState(performer, 'performer')} />
            </div>
          </div>
        );

      default:
        return <div className="ecos-activities__control-panel">{this.renderSelect()}</div>;
    }
  }

  renderEditor() {
    const { saveIsLoading, comment } = this.props;
    const { isLoading } = this.state;

    return (
      <div className="ecos-activities__editor">
        {this.renderControlPanel()}

        {isLoading && <Loader blur />}
        <RichTextEditor htmlString={comment ? comment.text : null} onChange={this.handleEditorStateChange} />
        <div className="ecos-activities__editor-footer">
          {this.state.isInternalSupported && (
            <div className="ecos-activities__editor-footer-chbx-wrapper">
              <Label title={t('comments-widget.editor.internal_comment')}>
                <Checkbox
                  disabled={!!comment}
                  checked={comment ? comment.isInternal : false}
                  title={t('comments-widget.editor.internal_comment')}
                  onChange={({ checked }) => this.setState({ isInternal: checked })}
                />

                <span className="ecos-activities__editor-footer-chbx-wrapper__text">{t('comments-widget.editor.internal_comment')}</span>
              </Label>
            </div>
          )}
          <div className="ecos-activities__editor-footer-btn-wrapper">
            <Btn
              className="ecos-btn_grey5 ecos-btn_hover_color-grey ecos-activities__editor-footer-btn"
              onClick={this.handleCloseEditor}
              disabled={saveIsLoading}
            >
              {t('comments-widget.editor.cancel')}
            </Btn>
            <Btn
              className="ecos-btn_blue ecos-btn_hover_light-blue ecos-activities__editor-footer-btn"
              onClick={this.handleSaveActivity}
              disabled={this.disabledEditor}
              loading={saveIsLoading}
            >
              {t('comments-widget.editor.save')}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  hasResultActive() {
    const { type = {}, result = '' } = this.props.comment;
    const typeId = get(type, 'id', '');

    if (
      !isEmpty(type) &&
      !!typeId &&
      (typeId === ActivityTypes.CALL || typeId === ActivityTypes.EMAIL || typeId === ActivityTypes.MEETING)
    ) {
      return !!result;
    }

    return false;
  }

  renderTypeInfo() {
    const {
      titleAssignment,
      activityDate,
      activityDuration,
      dueDate,
      priority,
      initiator,
      performer,
      responsible,
      type = {}
    } = this.props.comment;

    const typeId = get(type, 'id');

    const inMomentActivity = moment(activityDate);
    const inMomentDue = moment(dueDate);

    const responsibleDisplayName = get(responsible, 'displayName');
    const initiatorDisplayName = get(initiator, 'displayName');
    const performerDisplayName = get(performer, 'displayName');

    if (IMMEDIATE_ACTIVITY.includes(typeId)) {
      return (
        <>
          {!!titleAssignment && (
            <div>
              {t('activities-widget.fields.title')}: {titleAssignment}
            </div>
          )}
          {!!dueDate && inMomentDue && (
            <div>
              {t('activities-widget.fields.due-date')}: {inMomentDue.format('DD.MM.YYYY HH:mm')}
            </div>
          )}
          {isNumber(priority) && (
            <div>
              {t('activities-widget.fields.priority')}: {priority}
            </div>
          )}
          {!!initiatorDisplayName && (
            <div>
              {t('activities-widget.fields.initiator')}: {initiatorDisplayName}
            </div>
          )}
          {!!performerDisplayName && (
            <div>
              {t('activities-widget.fields.performer')}: {performerDisplayName}
            </div>
          )}
        </>
      );
    }

    if (PLANNED_ACTIVITY.includes(typeId)) {
      return (
        <>
          {!!responsible && !!responsibleDisplayName && (
            <div>
              {t('activities-widget.fields.responsible')}: {responsibleDisplayName}
            </div>
          )}
          {!!activityDuration && (
            <div>
              {t('activities-widget.fields.activity-duration')}: {activityDuration}
            </div>
          )}
          {!!activityDate && inMomentActivity && (
            <div>
              {t('activities-widget.fields.activity-date')}: {inMomentActivity.format('DD.MM.YYYY HH:mm')}
            </div>
          )}
        </>
      );
    }

    return null;
  }

  renderDescription() {
    const { status = '', commentActivity = '', type = {}, result } = this.props.comment;

    return (
      <>
        {!!status && (
          <div>
            {t('activities-widget.fields.status')}: {status}
          </div>
        )}
        {!!commentActivity && (
          <div>
            {t('activities-widget.fields.comment-activity')}: {commentActivity}
          </div>
        )}
        {!isEmpty(type) && !!get(type, 'displayName') && (
          <div>
            {t('activities-widget.fields.type')}: {type.displayName}
          </div>
        )}
        {this.hasResultActive() && (
          <div>
            {t('activities-widget.fields.result')}: {result}
          </div>
        )}
      </>
    );
  }

  render() {
    const { comment } = this.props;
    const { isEdit } = this.state;

    if (comment === null) {
      return this.renderEditor();
    }

    const { id, avatar = '', firstName, lastName, middleName, displayName, text, canEdit = false, canDelete = false } = comment;

    return (
      <div className="ecos-activities__comment" key={id}>
        <div className="ecos-activities__comment-header">
          <div className="ecos-activities__comment-header-cell">
            <Avatar
              url={avatar}
              userName={displayName}
              noBorder
              className="ecos-activities__comment-avatar"
              classNameEmpty="ecos-activities__comment-avatar_empty"
            />

            <div className="ecos-activities__comment-header-column ecos-activities__comment-name-container">
              <div className="ecos-activities__comment-name">
                {firstName} {middleName}
              </div>
              <div className="ecos-activities__comment-name">{lastName}</div>
              {!isEdit && this.renderCommentDate()}
              {!isEdit && this.renderDescription()}
              {!isEdit && this.renderTypeInfo()}
            </div>

            <div className="ecos-activities__comment-header-column ecos-activities__comment-tag-container">{this.renderTags()}</div>
          </div>
          {!isEdit && (
            <div className="ecos-activities__comment-header-cell ecos-activities__comment-header-cell_actions">
              {canEdit && (
                <div
                  className="ecos-activities__comment-btn ecos-activities__comment-btn-edit icon-edit"
                  title={t('comments-widget.icon.edit')}
                  onClick={this.handleEditActivity}
                />
              )}
              {canDelete && (
                <div
                  className="ecos-activities__comment-btn ecos-activities__comment-btn-delete icon-delete"
                  title={t('comments-widget.icon.delete')}
                  onClick={this.toggleConfirmDialog}
                />
              )}
            </div>
          )}
        </div>
        {!isEdit && (
          <RichTextEditor readonly className="ecos-activities__comment-editor" htmlString={text} onChange={this.handleEditorStateChange} />
        )}
        {isEdit && this.renderEditor()}

        {this.renderConfirmDelete(this.props.deleteActivity)}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByRecordRef(state, ownProps.record),
  isMobile: state.view.isMobile,
  userName: state.user.userName
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  getActivities: () => dispatch(getActivities(ownProps.record)),
  createActivity: (recordRef, activity, rest, callback) => dispatch(createActivityRequest({ activity, recordRef, callback, ...rest })),
  updateActivity: (recordRef, activity, rest, callback) => dispatch(updateActivityRequest({ activity, recordRef, callback, ...rest })),
  deleteActivity: (recordRef, id, callback) => dispatch(deleteActivityRequest({ id, recordRef, callback })),
  setErrorMessage: message => dispatch(setError({ message, recordRef: ownProps.record }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Activity);
