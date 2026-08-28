import { Credentials } from '../options';
import { Capability } from './HelloData';

export type Controller = {
  user: Credentials;
  side: 0 | 1;
  sideName: string;
  entities: Record<string, unknown>;
  capability: Capability;
};
