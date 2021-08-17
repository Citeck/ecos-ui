import React from 'react';
import { connect } from 'react-redux';
import { isKanban } from '../constants';
import ViewTabs from '../ViewTabs';
import { selectViewMode } from '../../../selectors/journals';

function mapStateToProps(state, props) {
  const viewMode = selectViewMode(state, props.stateId);
  //todo test
  return {
    viewMode,
    id: 'board-identifier', // идентификатор доски
    name: { ru: 'Русское имя', en: 'English name' }, // имя доски для отображения
    readOnly: true, // возможно ли перемещать сущности между статусами
    typeRef: 'emodel/type@some-type', // ссылка на тип
    journalRef: 'uiserv/journal@some-journal', // ссылка на журнал
    cardFormRef: 'uiserv/form@some-form', // ссылка на форму для карточки
    actions: ['uiserv/action@some-action'], // действия
    columns: [
      {
        id: 'some-id',
        name: { ru: 'Русское имя', en: 'English name' }
      }
    ] // настройка колонок
  };
}

function mapDispatchToProps(dispatch) {
  return {};
}

class KanbanView extends React.Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, viewMode, stateId, journalId, urlParams = {} } = this.props;

    if (!journalId || !isActivePage || !isKanban(viewMode)) {
      return;
    }

    if (prevProps.journalId !== journalId || (stateId && prevProps.stateId !== stateId) || this.state.isClose) {
      this.setState({ isClose: false }, () => console.log(111));
    }
  }

  render() {
    const { Header, name, stateId, viewMode, bodyForwardedRef } = this.props;

    return (
      <div hidden={!isKanban(viewMode)} ref={bodyForwardedRef}>
        <Header title={name} />
        <div>
          <ViewTabs stateId={stateId} />
        </div>
        <div>kanban</div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(KanbanView);
