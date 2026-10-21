import Records from '@citeck/records-core';

import EcosFormUtils from '../EcosFormUtils/EcosFormUtils';

import { t } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

const recordRef = 'emodel/contract@test';
const formId = 'uiserv/form@custom-contract-edit';

describe('editRecord form selection', () => {
  beforeEach(() => {
    jest.spyOn(EcosFormUtils, 'hasForm').mockResolvedValue(false);
    jest.spyOn(EcosFormUtils, 'hasWritePermission').mockResolvedValue(true);
    jest.spyOn(EcosFormUtils, 'getFormById').mockResolvedValue(false);
    jest.spyOn(EcosFormUtils, 'eform').mockImplementation(() => {});
    jest.spyOn(NotificationManager, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([true, false])('opens a custom form without requiring a record default (formContainer=%s)', async formContainer => {
    await EcosFormUtils.editRecord({ recordRef, formId, formContainer });

    expect(EcosFormUtils.hasForm).not.toHaveBeenCalled();
    expect(EcosFormUtils.getFormById).toHaveBeenCalledWith(formId, '_notExists?bool', true);
    expect(EcosFormUtils.hasWritePermission).toHaveBeenCalledWith(recordRef);
    expect(EcosFormUtils.eform).toHaveBeenCalledWith(
      recordRef,
      expect.objectContaining({
        formId,
        params: expect.objectContaining({ formId }),
        formContainer: formContainer || null
      })
    );
    expect(NotificationManager.error).not.toHaveBeenCalled();
  });

  it('notifies and calls the fallback when the configured form does not exist', async () => {
    EcosFormUtils.getFormById.mockResolvedValue(true);
    const fallback = jest.fn();
    await EcosFormUtils.editRecord({ recordRef, formId, fallback });
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error).toHaveBeenCalledWith(t('ecos-form.error.no-form'), t('error'));
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
  });

  it('notifies and calls the fallback when a custom form lookup rejects', async () => {
    const error = new Error('Form service unavailable');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    EcosFormUtils.getFormById.mockRejectedValue(error);
    const fallback = jest.fn();
    await EcosFormUtils.editRecord({ recordRef, formId, fallback });
    expect(console.error).toHaveBeenCalledWith(expect.any(String), error);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error).toHaveBeenCalledWith(t('ecos-form.error.form-is-not-available'), t('error'));
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
  });

  it.each([null, undefined])('does not treat an unknown existence value (%s) as an existing form', async notExists => {
    EcosFormUtils.getFormById.mockResolvedValue(notExists);
    const fallback = jest.fn();
    await EcosFormUtils.editRecord({ recordRef, formId, fallback });
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error).toHaveBeenCalledWith(t('ecos-form.error.form-is-not-available'), t('error'));
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
  });

  it('retries a real Records load after a transport failure was cached as null', async () => {
    EcosFormUtils.getFormById.mockRestore();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const retryFormId = 'uiserv/form@retry-after-transport-error';
    const form = Records.get('uiserv/rform@retry-after-transport-error');
    const load = jest
      .spyOn(form, '_loadRecordAttImpl')
      .mockRejectedValueOnce(new Error('Form service unavailable'))
      .mockResolvedValue(false);
    const fallback = jest.fn();

    await EcosFormUtils.editRecord({ recordRef, formId: retryFormId, fallback });
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error).toHaveBeenCalledTimes(1);

    await EcosFormUtils.editRecord({ recordRef, formId: retryFormId, fallback });
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith('_notExists?bool', true);
    expect(EcosFormUtils.eform).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error).toHaveBeenCalledTimes(1);
  });

  it.each([123, 0, true, false, [], {}])(
    'rejects a non-string formId (%j) without lookup or opening a default form',
    async invalidFormId => {
      const fallback = jest.fn();
      await EcosFormUtils.editRecord({ recordRef, formId: invalidFormId, fallback });
      expect(NotificationManager.error).toHaveBeenCalledWith(t('ecos-form.error.invalid-form-id'), t('error'));
      expect(fallback).toHaveBeenCalledTimes(1);
      expect(EcosFormUtils.getFormById).not.toHaveBeenCalled();
      expect(EcosFormUtils.hasForm).not.toHaveBeenCalled();
      expect(EcosFormUtils.eform).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, null, ''])('retains record-based form lookup when no override is configured (%j)', async emptyFormId => {
    EcosFormUtils.hasForm.mockResolvedValue(true);
    await EcosFormUtils.editRecord({ recordRef, formId: emptyFormId });
    expect(EcosFormUtils.hasForm).toHaveBeenCalledWith(recordRef);
    expect(EcosFormUtils.getFormById).not.toHaveBeenCalled();
    expect(EcosFormUtils.eform).toHaveBeenCalledTimes(1);
  });

  it('settles and notifies when permission loading fails', async () => {
    EcosFormUtils.hasWritePermission.mockRejectedValue(new Error('Permissions unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const fallback = jest.fn();
    await EcosFormUtils.editRecord({ recordRef, formId, fallback });
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error).toHaveBeenCalledTimes(1);
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
  });
});
