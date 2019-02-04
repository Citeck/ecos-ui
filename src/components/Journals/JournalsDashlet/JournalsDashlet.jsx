import React, { Component, Fragment } from 'react';
import { Container } from 'reactstrap';
import classNames from 'classnames';

import JournalsDashletEditor from '../JournalsDashletEditor';
import Dashlet from '../../Dashlet/Dashlet';

import TreeGrid from '../../common/grid/TreeGrid/TreeGrid';
import Pagination from '../../common/Pagination/Pagination';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';

import './JournalsDashlet.scss';

const products = [
  {
    id: 1,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 2,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 3,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 4,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 5,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 6,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 7,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 8,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 9,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 10,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 11,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 12,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 13,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  },
  {
    id: 14,
    date: '12.12.2019 6:03',
    title: 'Договор №806',
    status: 'Действует',
    ure: 'ООО "ФИНТЕКС"'
  }
];

export default class JournalsDashlet extends Component {
  constructor(props) {
    super(props);
    this.state = { visibleJournal: false };
  }

  showJournal = () => {
    this.setState({ visibleJournal: !this.state.visibleJournal });
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('journal-dashlet', props.className);

    return (
      <Container>
        <Dashlet {...props} className={cssClasses} onEdit={this.showJournal}>
          {this.state.visibleJournal ? (
            <Fragment>
              <div className={'journal-dashlet__toolbar'}>
                <IcoBtn icon={'icon-big-plus'} className={'btn_i btn_i-big-plus btn_blue btn_hover_light-blue btn_x-step_10'} />

                <IcoBtn invert={'true'} icon={'icon-down'} className={'btn_drop-down btn_r_6 btn_x-step_10'}>
                  Договоры
                </IcoBtn>
                <TwoIcoBtn icons={['icon-settings', 'icon-down']} className={'btn_grey btn_settings-down btn_x-step_10'} />
                <IcoBtn icon={'icon-download'} className={'btn_i btn_grey'} />

                <div className={'dashlet__actions'}>
                  <Pagination className={'dashlet__pagination'} />

                  <IcoBtn icon={'icon-list'} className={'btn_i btn_blue2 btn_width_auto btn_hover_t-light-blue btn_x-step_10'} />
                  <IcoBtn icon={'icon-pie'} className={'btn_i btn_grey2 btn_width_auto btn_hover_t-light-blue'} />
                </div>
              </div>

              <TreeGrid data={products} />

              <div className={'journal-dashlet__toolbar'}>
                <Pagination />
              </div>
            </Fragment>
          ) : (
            <JournalsDashletEditor />
          )}
        </Dashlet>
      </Container>
    );
  }
}
