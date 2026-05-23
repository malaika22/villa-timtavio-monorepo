export enum ExperienceStatus {
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending',
  UP_COMING = 'up-coming',
  CANCELLED = 'cancelled',
  AVAILABLE = 'available',
  /** Finished / eligible for repeat request — shows completed chip + Request again */
  COMPLETED = 'completed',
  /** Pre-check-in — grey overlay + lock + "Available at check-in" */
  LOCKED_PRE_ARRIVAL = 'locked-pre-arrival',
  /** Setup complete and ready for the guest */
  READY = 'ready',
}
