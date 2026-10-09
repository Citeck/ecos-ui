import EcosFormUtils from '../EcosFormUtils/EcosFormUtils';

const recordRef = 'emodel/contract@test';
const formId = 'uiserv/form@custom-contract-edit';

describe('editRecord form selection', () => {
  beforeEach(() => {
    jest.spyOn(EcosFormUtils, 'hasForm').mockResolvedValue(false);
    jest.spyOn(EcosFormUtils, 'hasWritePermission').mockResolvedValue(true);
    jest.spyOn(EcosFormUtils, 'getFormById').mockResolvedValue(false);
    jest.spyOn(EcosFormUtils, 'eform').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([true, false])('opens a custom form without requiring a record default (formContainer=%s)', async formContainer => {
    await new Promise(resolve => {
      EcosFormUtils.eform.mockImplementation(resolve);
      EcosFormUtils.editRecord({ recordRef, formId, formContainer });
    });

    expect(EcosFormUtils.hasForm).not.toHaveBeenCalled();
    expect(EcosFormUtils.getFormById).toHaveBeenCalledWith(formId, '_notExists?bool');
    expect(EcosFormUtils.hasWritePermission).toHaveBeenCalledWith(recordRef);
    expect(EcosFormUtils.eform).toHaveBeenCalledWith(
      recordRef,
      expect.objectContaining({
        formId,
        params: expect.objectContaining({ formId }),
        formContainer: formContainer || null
      })
    );
  });

  it('calls the fallback without opening a form when the configured form does not exist', async () => {
    EcosFormUtils.getFormById.mockResolvedValue(true);
    const fallback = jest.fn();
    await new Promise(resolve => {
      fallback.mockImplementation(resolve);
      EcosFormUtils.editRecord({ recordRef, formId, fallback });
    });
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
  });

  it('uses the existing fallback when the custom form lookup fails', async () => {
    const error = new Error('Form service unavailable');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    EcosFormUtils.getFormById.mockRejectedValue(error);
    await new Promise(resolve => {
      EcosFormUtils.editRecord({ recordRef, formId, fallback: resolve });
    });
    expect(console.error).toHaveBeenCalledWith(error);
    expect(EcosFormUtils.eform).not.toHaveBeenCalled();
  });

  it('retains record-based form lookup when no override is configured', async () => {
    EcosFormUtils.hasForm.mockResolvedValue(true);
    await new Promise(resolve => {
      EcosFormUtils.eform.mockImplementation(resolve);
      EcosFormUtils.editRecord({ recordRef });
    });
    expect(EcosFormUtils.hasForm).toHaveBeenCalledWith(recordRef);
    expect(EcosFormUtils.getFormById).not.toHaveBeenCalled();
  });
});
