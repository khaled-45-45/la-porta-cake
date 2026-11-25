import 'server-only';

import type { Repositories } from '@la-porta/domain';

import { readServerEnv } from '../env';
import { createLocalRepositories } from './local';

let repositories: Repositories | undefined;

/**
 * The repositories for the configured data source (decision 0004).
 * Pages and components get all data from here, never from data files directly.
 * V2 adds the API implementation behind the same interfaces.
 */
export function getRepositories(): Repositories {
  if (!repositories) {
    const { dataSource } = readServerEnv();
    switch (dataSource) {
      case 'local':
        repositories = createLocalRepositories();
        break;
    }
  }
  return repositories;
}
