import { createMessage } from './models';

/** Indicates that the global styling has changed & loaded (Light/Dark) */
export const applicationStylesChanged = createMessage('Application styles changed');
