import React from 'react';

const SKELETON_COUNT = 5;

const SkeletonCard = () => (
  <div className="ecos-kanban__card-skeleton">
    <div className="ecos-kanban__card-skeleton-header">
      <div className="ecos-kanban__card-skeleton-title" />
      <div className="ecos-kanban__card-skeleton-icon" />
    </div>
    <div className="ecos-kanban__card-skeleton-body">
      <div className="ecos-kanban__card-skeleton-line ecos-kanban__card-skeleton-line_long" />
      <div className="ecos-kanban__card-skeleton-line ecos-kanban__card-skeleton-line_medium" />
      <div className="ecos-kanban__card-skeleton-line ecos-kanban__card-skeleton-line_short" />
    </div>
  </div>
);

const SkeletonCards = () => (
  <>
    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </>
);

export default SkeletonCards;
