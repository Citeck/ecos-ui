import { RichUtils } from 'draft-js';

import * as DraftHelpers from '../draft';
import {
  getState,
  getNewStateWithSelectedText,
  modifier,
  getStateWithSelectedText,
  getStateWithAddedLinkBySelection
} from '../__mocks__/draft.mock';

describe('Draft helpers', () => {
  describe('Method getSelectionText', () => {
    it('No text should be selected (no text)', () => {
      const state = getState();

      expect(state.getSelection().isCollapsed()).toEqual(true);
    });

    const stateWithData = getNewStateWithSelectedText(0, 9);

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

    let stateWithData = getNewStateWithSelectedText(
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

  describe('Method getFirstSelectedLink', () => {
    it('editorState not transferred', () => {
      expect(DraftHelpers.getFirstSelectedLink()).toEqual('');
    });

    let stateWithData = getNewStateWithSelectedText(
      6,
      10,
      `Work hard to get what you like, \r
        otherwise you\'ll be forced to just like what you get.\r
        Work hard to get what you like, \r
        otherwise you\'ll be forced to just like what you get.`
    );

    stateWithData = getStateWithAddedLinkBySelection(stateWithData, { url: '/v2/dashboard', title: 'dashboard' });

    it('Received the first link with one added link', () => {
      expect(DraftHelpers.getFirstSelectedLink(stateWithData)).toEqual('/v2/dashboard');
    });

    let secondState = getStateWithSelectedText(stateWithData, 13, 20);

    secondState = getStateWithAddedLinkBySelection(secondState, { url: '/v2/debug', title: 'debug' });

    it('Received the first link with two added link', () => {
      expect(DraftHelpers.getFirstSelectedLink(secondState)).toEqual('/v2/debug');
    });

    let thirdState = getStateWithSelectedText(secondState, 1, 4);

    thirdState = getStateWithAddedLinkBySelection(secondState, { url: '/first-link', title: 'first-link' });

    it('Received the first link with three added link', () => {
      expect(DraftHelpers.getFirstSelectedLink(thirdState)).toEqual('/first-link');
    });
  });
});
