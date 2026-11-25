// @vitest-environment node
import { describeRepositoryContract } from '@la-porta/domain/testing';

import { readServerEnv } from '../env';
import { getRepositories } from './index';
import { createLocalRepositories } from './local';

describeRepositoryContract('local JSON', () => createLocalRepositories());

describe('local repositories: real content', () => {
  const repos = createLocalRepositories();

  it('return the 21 active products and the 16 published designs', async () => {
    expect(await repos.catalog.listProducts()).toHaveLength(21);
    expect(await repos.designs.listDesigns()).toHaveLength(16);
    expect(await repos.catalog.listCategories()).toHaveLength(2);
    expect(await repos.designs.listOccasions()).toHaveLength(6);
  });

  it('never return a pending image or an unpublished design', async () => {
    const products = await repos.catalog.listProducts();
    const designs = await repos.designs.listDesigns();
    const images = [...products.flatMap((p) => p.images), ...designs.map((d) => d.image)];
    expect(images).toHaveLength(31);
    expect(images.every((i) => i.review.status === 'approved')).toBe(true);
    expect(images.some((i) => i.src.startsWith('private-assets'))).toBe(false);
    expect(await repos.designs.getDesignBySlug('cartoon-character-batman')).toBeNull();
    expect(await repos.designs.getDesignBySlug('space-cake')).toBeNull();
  });

  it('show Despacito with a placeholder while its photo awaits approval', async () => {
    expect((await repos.catalog.getProductBySlug('despacito'))?.images).toEqual([]);
  });
});

describe('data source setting', () => {
  it('defaults to the local JSON content', () => {
    expect(readServerEnv({})).toEqual({ dataSource: 'local' });
    expect(readServerEnv({ DATA_SOURCE: '' })).toEqual({
      dataSource: 'local',
    });
    expect(readServerEnv({ DATA_SOURCE: 'local' })).toEqual({
      dataSource: 'local',
    });
  });

  it('rejects "api" until V2, with a clear message', () => {
    expect(() => readServerEnv({ DATA_SOURCE: 'api' })).toThrow(/planned for V2/);
  });

  it('rejects unknown values with a clear message', () => {
    expect(() => readServerEnv({ DATA_SOURCE: 'postgres' })).toThrow(
      /Unknown DATA_SOURCE "postgres"/,
    );
  });

  it('gives the same repositories on every call', () => {
    expect(getRepositories()).toBe(getRepositories());
  });
});
