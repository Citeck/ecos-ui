import EcosFormUtils from '../../../EcosForm/EcosFormUtils';

export const createUserActionNode = (config, fallback) => {
  return new Promise(resolve => {
    let recordRef = 'dict@' + config.nodeType;

    let showNewForm = () => {
      let attributes = {
        _parent: config.destination,
        _parentAtt: config.destinationAssoc
      };

      if (config.eventRef) {
        attributes['icaseEproc:eventRef'] = config.eventRef;
      }

      try {
        EcosFormUtils.eform(recordRef, {
          params: {
            onSubmit: () => resolve(true),
            onFormCancel: () => resolve(true),
            attributes
          },
          class: 'ecos-modal_width-lg',
          isBigHeader: true
        });
      } catch (e) {
        console.error(e);
        resolve(false);
      }
    };

    if (!fallback) {
      showNewForm();
    } else {
      EcosFormUtils.hasForm(recordRef).then(function(result) {
        if (result) {
          showNewForm();
        } else {
          fallback();
        }
      });
    }
  });
};
