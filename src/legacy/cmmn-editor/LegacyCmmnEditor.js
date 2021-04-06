import React from 'react';
import ReactDOM from 'react-dom';
import ecosFetch from '../../helpers/ecosFetch';
import Records from '../../components/Records';

export default class LegacyCmmnEditor extends React.Component {
  componentDidMount() {
    const { editorRootId } = this.props;
    const createVarsPromise = this._initCreateVariants();

    document.getElementById('page-node-info-label').innerText = 'Редактирование процесса №1';

    window.require(
      [
        'lib/knockout',
        'citeck/utils/knockout.utils',
        'citeck/utils/knockout.yui',
        'citeck/components/form/constraints',
        '/legacy/cmmn-editor/case-activities.js'
      ],
      (ko, koutils) => {
        createVarsPromise.then(() => {
          var Activity = koutils.koclass('cases.activities.Activity');
          var activity = new Activity({
            nodeRef: 'workspace://SpacesStore/5cd2e7f7-4c3f-411f-9b53-b23908ec8220',
            startable: false,
            stoppable: false,
            editable: true,
            removable: false,
            composite: true
          });

          ko.applyBindings(activity, document.getElementById(editorRootId));
          window.Alfresco.util.createTwister(`${editorRootId}-heading`, 'case-activities', { panel: `${editorRootId}-body` });
          window.YAHOO.Bubbling.on('metadataRefresh', function() {
            activity.reload(true);
          });
        });
      }
    );
  }

  async _initCreateVariants() {
    const variants = await ecosFetch('/alfresco/s/citeck/activity-create-variants').then(res => res.json());
    const createMenu = this._formatMenu(variants, null, {});
    const createMenuHtml = this._formatCreateMenuHtml(createMenu);

    let template = document.getElementById('add-activity');

    template.innerHTML = `
      <!-- ko if: composite() && editable() -->
      <div data-bind="attr: { id: nodeRef() + '-activity-create-menu' }"
           class="yui-overlay yuimenu button-menu" style="visibility: hidden">
        <div class="bd">
          <ul class="first-of-type">${createMenuHtml}</ul>
        </div>
      </div>
      <span title="Создать..."
            data-bind="yuiButton: { type: 'menu', menu: nodeRef() + '-activity-create-menu' }, click: function() {}, clickBubble: false">
        <span class="first-child action create">
          <button>&nbsp;</button>
        </span>
      </span>
      <!-- /ko -->
    `;
  }

  _formatCreateMenuHtml(elements) {
    let result = '';
    for (let elementKey in elements) {
      if (!elements.hasOwnProperty(elementKey)) {
        continue;
      }
      const element = elements[elementKey];
      result += `<li class="yuimenuitem">
                    <span class="yuimenuitemlabel" >${element.title}</span>
                    <div class="yuimenu" style="visibility: hidden">
                        <div class="bd">
                            <ul>`;
      for (let variant of element.variants) {
        let paramsJson = JSON.stringify(variant.viewParams || {});
        paramsJson = paramsJson.replaceAll('"', "'");
        result += `<li class="yuimenuitem">
                        <a class="yuimenuitemlabel" data-bind="click: $data.add.bind($data, '${variant.type}', '${variant.formId ||
          ''}', ${paramsJson})">${variant.title}</a>
                    </li>`;
      }

      result += `</ul></div></div></li>`;
    }

    return result;
  }

  _formatMenu(variants, parent, menuRoot) {
    const getSubMenu = function(variant) {
      let subMenu = menuRoot[variant.id];
      if (!subMenu) {
        subMenu = {
          title: variant.title,
          variants: []
        };
        menuRoot[variant.id] = subMenu;
      }
      return subMenu;
    };

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (variant.canBeCreated) {
        const subMenu = getSubMenu(parent || variant);
        subMenu.variants.push(variant);
      }

      this._formatMenu(variant.children, variant, menuRoot);
    }

    return menuRoot;
  }

  render() {
    const { editorRootId } = this.props;

    return (
      <div
        id={editorRootId}
        dangerouslySetInnerHTML={{
          __html: `
        <h2 id="${editorRootId}-heading" class="thin dark">
          Редактор CMMN процесса
          <span class="alfresco-twister-actions">
            <!-- ko template: { name: 'add-activity' } --><!-- /ko -->
          </span>
        </h2>
        <div id="${editorRootId}-body" class="panel-body">
          <span class="header right" data-bind="visible: hasActivities()">
            <span class="type">Тип</span>
            <span class="start">Начало</span>
            <span class="end">Завершение</span>
            <span class="sla">SLA</span>
          </span>
          <div id="${editorRootId}-DnD" class="dnd-area" data-bind="DDRoot: { data: $data, errorMessage: 'Ошибка' }">
            <!-- ko template: { name: 'activities' } --><!-- /ko -->
          </div>
        </div>
      </div>
    `
        }}
      />
    );
  }

  static renderEditor(containerId) {
    const editorRootId = containerId + '-legacy-editor-root-id';
    ReactDOM.render(React.createElement(LegacyCmmnEditor, { editorRootId }), document.getElementById(containerId));
  }
}
