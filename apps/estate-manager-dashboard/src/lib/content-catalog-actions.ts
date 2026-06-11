type ExperienceFormHandler = (experienceId?: string) => void;

let openExperienceFormHandler: ExperienceFormHandler | null = null;

export function registerOpenExperienceForm(handler: ExperienceFormHandler) {
  openExperienceFormHandler = handler;
}

export function unregisterOpenExperienceForm() {
  openExperienceFormHandler = null;
}

export function triggerOpenExperienceForm(experienceId?: string) {
  openExperienceFormHandler?.(experienceId);
}
