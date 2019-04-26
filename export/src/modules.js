
import '../../src/components/EcosForm/export';
import '../../src/components/EcosForm/glyphicon-to-fa.scss';
import '../../src/components/common/EcosModal/CiteckEcosModal';
import '../../src/components/Records'
import '../../src/components/Journals/JournalsDashlet/export';

import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';

import { registerCiteckLibComponent } from '../../src/helpers/util'

registerCiteckLibComponent("React", React);
registerCiteckLibComponent("ReactDOM", ReactDOM);
registerCiteckLibComponent("moment", moment);
registerCiteckLibComponent("redux", {
  createStore, applyMiddleware, compose, combineReducers
});
registerCiteckLibComponent("react-redux", {
  Provider, connect
});
registerCiteckLibComponent("reactstrap", {
  UncontrolledDropdown, DropdownMenu, DropdownToggle, Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col
});
registerCiteckLibComponent("react-custom-scrollbars", { Scrollbars });
registerCiteckLibComponent("redux-thunk", thunk);
