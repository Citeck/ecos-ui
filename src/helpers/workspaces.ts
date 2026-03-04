import FormManager from '@/components/EcosForm/FormManager';
import Records from '@/components/Records';
import { WorkspaceType } from '@/api/workspaces/types';
import { SourcesId } from '@/constants';

interface CreateWorkspaceCallbacks {
  getWorkspaces: () => void;
  getSidebarWorkspaces: () => void;
  openLink: (id: WorkspaceType['id'], homePageLink: WorkspaceType['homePageLink']) => void;
}

export async function openCreateWorkspaceForm({ getWorkspaces, getSidebarWorkspaces, openLink }: CreateWorkspaceCallbacks) {
  const variant = await Records.get(`${SourcesId.TYPE}@workspace`).load('createVariants?json');

  FormManager.createRecordByVariant(variant, {
    onHideModal: () => getWorkspaces(),
    onSubmit: async (record: any) => {
      const { id: wsId, homePageLink } = await Records.get(record).load({
        id: 'id',
        homePageLink: 'homePageLink?str'
      });
      openLink(wsId, homePageLink);
      getSidebarWorkspaces();
    },
    initiator: {
      type: 'form-component',
      name: 'CreateVariants'
    }
  });
}
