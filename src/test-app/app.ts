import { extendZodWithOpenApi, type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import type { FetchHandler } from '../index.js';
import { Response404, Response415, Response422, Response500, Validator } from '../index.js';
import { registry } from './registry.js';

extendZodWithOpenApi(z);

// Define Zod schemas for the request parameters, query and body

const ThingParamsSchema = z
  .object({
    thingId: z.string().regex(/[\d]+/),
  })
  .openapi({});

const ThingQuerySchema = z
  .object({
    thingId: z.string().regex(/[\d]+/).optional(),
  })
  .openapi({});

const ThingBodySchema = z
  .object({
    name: z.string().regex(/[a-z]+/),
    description: z.string().regex(/[a-z]+/),
  })
  .openapi({});

// Define an OpenAPI route using https://github.com/asteasolutions/zod-to-openapi

export const routeConfig: RouteConfig = {
  method: 'post',
  path: '/things/{thingId}',
  request: {
    params: ThingParamsSchema,
    query: ThingQuerySchema,
    body: {
      content: {
        'application/json': {
          schema: ThingBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Create a thing',
      content: {
        'application/json': {
          schema: ThingBodySchema,
        },
      },
    },
    404: Response404,
    415: Response415,
    422: Response422,
    500: Response500,
  },
};

// Add the route to the global registry - used to write the OpenAPI spec for the whole app
registry.registerPath(routeConfig);

const validator = new Validator(routeConfig);

type ThingParams = z.infer<typeof ThingParamsSchema>;
type ThingBody = z.infer<typeof ThingBodySchema>;

export const thingHandler: FetchHandler = async (input, init) => {
  const params = validator.params<ThingParams>(init?.params);
  const body = await validator.body<ThingBody>(input);
  if (params.thingId === respondWithBadTypeParams.thingId) {
    return validator.validate(Response.json({ foo: 'bar' }));
  }
  return validator.validate(Response.json(body));
};

export const goodThing: ThingBody = {
  name: 'mything',
  description: 'besthingever',
};

export const badThing: ThingBody = {
  name: 'MYTHING',
  description: 'WORSTTHINGEVER',
};

export const goodParams: ThingParams = {
  thingId: '1',
};

export const badParams: ThingParams = {
  thingId: 'xyz',
};

export const respondWithBadTypeParams: ThingParams = {
  thingId: '2',
};

export function thingRequest({ thingId }: ThingParams, thing: ThingBody) {
  return new Request(`http://host.com/things/${encodeURIComponent(thingId)}`, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(thing),
  });
}
