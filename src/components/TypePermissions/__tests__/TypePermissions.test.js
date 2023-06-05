import { switchTypePerm } from '../helpers/switchTypePerm';
import { TYPE_PERM_NONE, TYPE_PERM_READ, TYPE_PERM_WRITE } from '../constants';

describe('switchDocPerm helper', () => {
  it('switch DOC_PERM_NONE -> DOC_PERM_READ', () => {
    expect(switchTypePerm(TYPE_PERM_NONE)).toEqual(TYPE_PERM_READ);
  });
  it('switch DOC_PERM_READ -> DOC_PERM_WRITE', () => {
    expect(switchTypePerm(TYPE_PERM_READ)).toEqual(TYPE_PERM_WRITE);
  });
  it('switch DOC_PERM_WRITE -> DOC_PERM_NONE', () => {
    expect(switchTypePerm(TYPE_PERM_WRITE)).toEqual(TYPE_PERM_NONE);
  });
  it('switch UNKNOWN -> DOC_PERM_READ', () => {
    expect(switchTypePerm(undefined)).toEqual(TYPE_PERM_READ);
    expect(switchTypePerm(null)).toEqual(TYPE_PERM_READ);
    expect(switchTypePerm('')).toEqual(TYPE_PERM_READ);
    expect(switchTypePerm('UNKNOWN')).toEqual(TYPE_PERM_READ);
  });
});
