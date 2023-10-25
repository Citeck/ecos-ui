import React from 'react';
import Modeler from 'bpmn-js/lib/Modeler';
import isFunction from 'lodash/isFunction';

import customModules from './modules';

import './patches';

import ecosTask from '../../ModelEditor/BPMNModeler/moddle/ecosTask.json';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './style.scss';

import ModelViewer from '../ModelViewer';
import { Sheet } from '../Sheet';

export default class BPMNViewer extends ModelViewer {
  static querySelector = 'ecos-bpmn-model-container';

  init = async ({ diagram, container, onInit, onMounted, modelEvents, markedElement, zoom, zoomCenter }) => {
    isFunction(onInit) && onInit(true);

    this.modeler = new Modeler({
      additionalModules: [...customModules],
      moddleExtensions: {
        ecosTask: ecosTask
      },
      keyboard: { bindTo: document }
    });

    if (container) {
      this.container = container;
      this.modeler.attachTo(container);
    }

    await this.setDiagram(diagram, { onMounted });
    this.setEvents(modelEvents);
    this.switchToReadonly();

    this.zoomCenter = zoomCenter;
    zoom && this.canvas.zoom(zoom, zoomCenter);
    markedElement && this.setMarkedElement(markedElement);
  };

  renderSheet = props => (
    <Sheet {...props} className={BPMNViewer.querySelector} init={this.init} setMarkedElement={this.setMarkedElement} />
  );

  switchToReadonly = () => {
    this.modeler && this.modeler.off('element.dblclick');
  };
}
