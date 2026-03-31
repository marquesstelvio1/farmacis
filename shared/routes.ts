import { z } from 'zod';
import { products, pillIdentificationRequestSchema, pillIdentificationResponseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        search: z.string().optional(),
        disease: z.string().optional()
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ai: {
    identifyPill: {
      method: 'POST' as const,
      path: '/api/ai/identify-pill' as const,
      input: pillIdentificationRequestSchema,
      responses: {
        200: pillIdentificationResponseSchema,
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
  pharmacies: {
    list: {
      method: 'GET' as const,
      path: '/api/pharmacies' as const,
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: z.any(),
      responses: {
        201: z.any(),
      },
    },
    status: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
      responses: {
        200: z.any(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProductResponse = typeof products.$inferSelect & {
  pharmacyName?: string;
  pharmacyLogo?: string | null;
};
export type PillIdRequest = z.infer<typeof pillIdentificationRequestSchema>;
export type PillIdResponse = z.infer<typeof pillIdentificationResponseSchema>;
