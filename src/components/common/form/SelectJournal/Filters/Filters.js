import React from 'react';
import { Col, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import Button from '../../../../common/buttons/Button/Button';
import Dropdown from '../../../../common/form/Dropdown';
import { IcoBtn } from '../../../../common/btns';
import FiltersContext from './FiltersContext';
import './Filters.scss';

const Filters = ({ columns }) => (
  <FiltersContext.Consumer>
    {context => (
      <div className="select-journal-filters">
        <div className="select-journal-filters__list-wrapper">
          <ul className="select-journal-filters__list">
            {context.fields.map((item, idx) => {
              return (
                <li key={`${item.attribute}_${idx}`} className="select-journal-filters__list-item">
                  {item.text}

                  <span data-idx={idx} className={'icon icon-delete'} onClick={context.removeField} />
                </li>
              );
            })}
          </ul>
        </div>

        <Row>
          <Col md={6} xs={12}>
            <Dropdown source={columns} valueField={'attribute'} titleField={'text'} isStatic onChange={context.addField}>
              <IcoBtn invert={'true'} icon="icon-down" className="btn_drop-down btn_r_8 btn_grey6">
                Добавить критерий
              </IcoBtn>
            </Dropdown>
          </Col>
          <Col md={6} xs={12}>
            <div className="select-journal-filters__apply-button-wrapper">
              <Button className={'button_blue'}>Применить</Button>
            </div>
          </Col>
        </Row>
      </div>
    )}
  </FiltersContext.Consumer>
);

Filters.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      attribute: PropTypes.string,
      text: PropTypes.string
    })
  )
};

export default Filters;
