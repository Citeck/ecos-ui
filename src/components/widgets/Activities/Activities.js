import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import { getActivities } from '../../../actions/activities';
import DAction from '../../../services/DashletActionService';
import { selectStateByRecordRef } from '../../../selectors/activities';
import { Btn } from '../../common/btns/index';
import Dashlet from '../../Dashlet';
import Activity from './Activity';
import { t } from '../../../helpers/util';
import BaseWidget from '../BaseWidget';
import { ActivityInterface, IdInterface } from './propsInterfaces';

import './style.scss';

class Activities extends BaseWidget {
  static propTypes = {
    id: IdInterface.isRequired,
    activities: PropTypes.arrayOf(PropTypes.shape(ActivityInterface)),
    dataStorageFormat: PropTypes.oneOf(['raw', 'html', 'plain-text']),
    maxLength: PropTypes.number,
    totalCount: PropTypes.number,
    errorMessage: PropTypes.string,
    saveIsLoading: PropTypes.bool,
    fetchIsLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool,
    isMobile: PropTypes.bool,
    userName: PropTypes.string,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    getActivities: PropTypes.func,
    createActivity: PropTypes.func,
    updateActivity: PropTypes.func,
    deleteActivity: PropTypes.func,
    setErrorMessage: PropTypes.func
  };

  static defaultProps = {
    ...super.defaultProps,
    activities: [],
    getActivities: () => {},
    createActivity: () => {},
    updateActvity: () => {},
    deleteActvity: () => {}
  };

  constructor(props) {
    super(props);

    this.contentRef = React.createRef();
    this._scroll = React.createRef();
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData();
  }

  fetchData = () => {
    const { getActivities } = this.props;

    getActivities();
  };

  handleShowEditor = () => {
    this.setState({
      isEdit: true
    });
  };

  handleCloseEditor = () => {
    this.setState({
      isEdit: false
    });
  };

  renderHeader() {
    const { record, saveIsLoading, userName, actionFailed } = this.props;
    const { isEdit } = this.state;

    return (
      <div>
        <div className="ecos-activities__header">
          {isEdit ? (
            <Activity
              comment={null}
              userName={userName}
              saveIsLoading={saveIsLoading}
              actionFailed={actionFailed}
              recordRef={record}
              onClose={this.handleCloseEditor}
            />
          ) : (
            <>
              <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-comments__add-btn" onClick={this.handleShowEditor}>
                {t('activities-widget.add')}
              </Btn>
            </>
          )}
        </div>
      </div>
    );
  }

  renderActivities() {
    const { record, activities, isMobile, saveIsLoading, userName, actionFailed } = this.props;

    if (!activities.length) {
      return null;
    }

    const renderActivitiesList = () => (
      <div className="ecos-activities__list" ref={this.contentRef}>
        {activities.map(activity => (
          <Activity
            key={activity.id}
            comment={activity}
            userName={userName}
            saveIsLoading={saveIsLoading}
            actionFailed={actionFailed}
            recordRef={record}
            onClose={this.handleCloseEditor}
          />
        ))}
      </div>
    );

    if (isMobile) {
      return renderActivitiesList();
    }

    return (
      <Scrollbars autoHide ref={this._scroll} {...this.scrollbarProps}>
        {renderActivitiesList()}
      </Scrollbars>
    );
  }

  render() {
    const { dragHandleProps, canDragging, fetchIsLoading } = this.props;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.fetchData
      }
    };

    return (
      <div className={this.className}>
        <Dashlet
          setRef={this.setDashletRef}
          title={t('activities-widget.title')}
          actionConfig={actions}
          needGoTo={false}
          canDragging={canDragging}
          dragHandleProps={dragHandleProps}
          resizable
          isLoading={fetchIsLoading}
          onResize={this.handleResize}
          contentMaxHeight={this.clientHeight + this.otherHeight}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={this.isCollapsed}
        >
          {this.renderHeader()}
          {this.renderActivities()}
        </Dashlet>
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
  getActivities: () => dispatch(getActivities(ownProps.record))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Activities);
