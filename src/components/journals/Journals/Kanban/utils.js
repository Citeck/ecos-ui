export function isDropDisabled({ readOnly, isLoadingCol, columnInfo }) {
  return readOnly || isLoadingCol || columnInfo.id === 'EMPTY';
}

/**
 * A swimlane row is busy while its card move or one of its cell pages is in flight: the two race
 * each other (COREDEV-426), so the row is serialized as a whole.
 *
 * The UI gate (hidden «Ещё», disabled DnD) and the saga guards must agree — if the UI lets a drop
 * through that `sagaMoveSwimlaneCard` then discards, the card silently snaps back with no
 * notification. Hence one definition, used by both.
 */
export function isSwimlaneBusy(swimlane) {
  if (!swimlane) {
    return false;
  }

  return !!swimlane.isMoving || Object.values(swimlane.cells || {}).some(cell => cell.isLoading);
}
