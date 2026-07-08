import { OrganizerConfig, OrganizerTemplate, OrganizerState } from '../models';
import { normalizeTemplateToState } from '../models/organizer-utils';

export class TemplateManager {
  static applyTemplate(
    template: OrganizerTemplate,
    currentState: OrganizerState | undefined,
    config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates'>
  ): OrganizerState {
    return normalizeTemplateToState(template, currentState, config);
  }
}
