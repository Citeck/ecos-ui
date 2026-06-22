/**
 * @citeck/records-predicates — platform-agnostic predicate / query-building
 * utilities for the Citeck Records API. Complements @citeck/records-core.
 */
export { default as Predicate } from './Predicate';
export { default as WrapperPredicate } from './WrapperPredicate';
export { default as FilterPredicate } from './FilterPredicate';
export { default as GroupPredicate } from './GroupPredicate';
export { default as ParserPredicate } from './ParserPredicate';
export { getAttFromPredicate, getId } from './utils';
export type { PredicateInit } from './Predicate';
