/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Create custom functions for the FLOWABLE-editor
FLOWABLE.TOOLBAR.ACTIONS.closeEditor =  function(services) {
  // case model
  if (services.editorManager && services.editorManager.getStencilData()) {
    var stencilNameSpace = services.editorManager.getStencilData().namespace;
    if (stencilNameSpace !== undefined && stencilNameSpace !== null && stencilNameSpace.indexOf('cmmn1.1') !== -1) {
      services.$location.path("/casemodels");
      return;
    }
  }

  // process model
  // window.history.back();
  var refererPagePathName = localStorage.getItem('BpmnRefererPagePathName');
  localStorage.removeItem('BpmnRefererPagePathName');
  if (refererPagePathName === window.BPMN_DESIGNER_CONTEXT) {
    window.location.href = window.BPMN_DESIGNER_CONTEXT;
  } else {
    window.location.href = window.CARD_DETAILS_CONTEXT + services.editorManager.modelId;
  }
};

FLOWABLE.TOOLBAR.ACTIONS.navigateToProcess = function(processId) {
    var navigateEvent = {
        type: FLOWABLE.eventBus.EVENT_TYPE_NAVIGATE_TO_PROCESS,
        processId: processId
    };
    FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_NAVIGATE_TO_PROCESS, navigateEvent);
},

// Add custom buttons 
FLOWABLE.TOOLBAR_CONFIG.secondaryItems.push( 
	{
        "type" : "button",
        "title" : "Close",
        "cssClass" : "glyphicon glyphicon-remove",
        "action" : "FLOWABLE.TOOLBAR.ACTIONS.closeEditor"
    }
);




