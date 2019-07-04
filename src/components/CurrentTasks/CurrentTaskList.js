import * as React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { Scrollbars } from 'react-custom-scrollbars';
import { getOutputFormat, t } from '../../helpers/util';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { Grid } from '../common/grid';
import Loader from '../common/Loader/Loader';
import Separator from '../common/Separator/Separator';
import { CurrentTaskPropTypes, DisplayedColumns as DC, iconGroup, noData } from './utils';
import CurrentTaskInfo from './CurrentTaskInfo';

class CurrentTaskList extends React.Component {
  static propTypes = {
    currentTasks: PropTypes.arrayOf(CurrentTaskPropTypes).isRequired,
    className: PropTypes.string,
    height: PropTypes.string
  };

  static defaultProps = {
    currentTasks: [],
    className: '',
    height: '100%'
  };

  className = 'ecos-current-task-list';

  renderLoader() {
    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader />
      </div>
    );
  }

  renderEmpty() {
    return <div className={this.className + '_empty'}>{t('Нет задач')}</div>;
  }

  renderEnum() {
    const { currentTasks } = this.props;

    return (
      <div className={`${this.className}_view-enum`}>
        {currentTasks.map((item, i) => (
          <React.Fragment key={item.id + i}>
            <CurrentTaskInfo task={item} />
            <Separator noIndents />
          </React.Fragment>
        ))}
      </div>
    );
  }

  renderTable() {
    const { currentTasks } = this.props;
    const formatTasks = currentTasks.map((item, i) => {
      return {
        [DC.title.key]: item[DC.title.key] || noData,
        [DC.actors.key]: (
          <React.Fragment>
            {item[DC.actors.key] || noData}
            {iconGroup(item.isGroup)}
          </React.Fragment>
        ),
        [DC.deadline.key]: getOutputFormat(DC.deadline.format, item[DC.deadline.key]) || noData
      };
    });

    const cols = [DC.title, DC.actors, DC.deadline];
    const updCols = ArrayOfObjects.replaceKeys(cols, { key: 'dataField', label: 'text' });
    const gridCols = ArrayOfObjects.filterKeys(updCols, ['dataField', 'text']);
    const classes = `${this.className}_view-table`;

    return <Grid data={formatTasks} columns={gridCols} scrollable={true} className={classes} />;
  }

  renderSwitch() {
    const { isSmallMode, isLoading, currentTasks } = this.props;
    const isEmptyList = isEmpty(currentTasks);

    if (isLoading) {
      return this.renderLoader();
    }

    if (isEmptyList) {
      return this.renderEmpty();
    }

    if (isSmallMode) {
      return this.renderEnum();
    }

    return this.renderTable();
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars
        style={{ height }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        {this.renderSwitch()}
      </Scrollbars>
    );
  }
}

export default CurrentTaskList;
