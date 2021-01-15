import { RichUtils } from 'draft-js';

import * as DraftHelpers from '../draft';
import { getState, getStateWithSelectedText, modifier } from '../__mocks__/draft.mock';

describe('Draft helpers', () => {
  describe('Method getSelectionText', () => {
    it('No text should be selected (no text)', () => {
      const state = getState();

      expect(state.getSelection().isCollapsed()).toEqual(true);
    });

    const stateWithData = getStateWithSelectedText(0, 9);

    it('Text must be selected', () => {
      expect(stateWithData.getSelection().isCollapsed()).toEqual(false);
    });

    it('Selection text matches', () => {
      expect(DraftHelpers.getSelectionText(stateWithData)).toEqual('Work hard');
    });
  });

  describe('Method getSelectedBlocks', () => {
    it('editorState not transferred', () => {
      expect(DraftHelpers.getSelectedBlocks()).toEqual(null);
    });

    it('Selected block key match', () => {
      const stateWithData = getState(
        `Work hard to get what you like, \r
        otherwise you\'ll be forced to just like what you get.\r
        Work hard to get what you like, \r
        otherwise you\'ll be forced to just like what you get.`
      );
      const blockList = stateWithData
        .getCurrentContent()
        .getBlockMap()
        .toList();
      const selectedBlocks = DraftHelpers.getSelectedBlocks(stateWithData, blockList.get(0).getKey(), blockList.get(2).getKey());

      expect(blockList.count()).toEqual(4);
      expect(selectedBlocks.length).toEqual(3);
    });
  });

  describe('Method modifierSelectedBlocks', () => {
    it('editorState not transferred', () => {
      expect(DraftHelpers.modifierSelectedBlocks()).toEqual(null);
    });

    let stateWithData = getStateWithSelectedText(
      0,
      10,
      `Work hard to get what you like, \r
        otherwise you\'ll be forced to just like what you get.\r
        Work hard to get what you like, \r
        otherwise you\'ll be forced to just like what you get.`
    );

    it('Add link to selected blocks', () => {
      let contentState = stateWithData.getCurrentContent();

      contentState = contentState.createEntity(DraftHelpers.BUTTONS_TYPE.LINK, 'MUTABLE', { url: '/v2/dashboard', title: 'dashboard' });
      stateWithData = DraftHelpers.modifierSelectedBlocks(stateWithData, modifier, contentState.getLastCreatedEntityKey());

      expect(RichUtils.currentBlockContainsLink(stateWithData)).toEqual(true);
    });

    it('Remove link from selected blocks', () => {
      stateWithData = DraftHelpers.modifierSelectedBlocks(stateWithData, modifier, null);

      expect(RichUtils.currentBlockContainsLink(stateWithData)).toEqual(false);
    });
  });
});
