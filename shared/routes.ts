import { z } from 'zod';
import { 
  insertScenarioSchema, 
  insertSceneSchema, 
  insertChatSchema, 
  insertChatMessageSchema,
  insertAvatarSchema,
  scenarios,
  scenes,
  chats,
  chatMessages,
  avatars,
  users,
  contacts,
  libraryItems
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Scenarios
  scenarios: {
    list: {
      method: 'GET' as const,
      path: '/api/scenarios' as const,
      responses: {
        200: z.array(z.custom<typeof scenarios.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/scenarios' as const,
      input: insertScenarioSchema,
      responses: {
        201: z.custom<typeof scenarios.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/scenarios/:id' as const,
      responses: {
        200: z.custom<typeof scenarios.$inferSelect & { scenes: typeof scenes.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/scenarios/:id' as const,
      input: insertScenarioSchema.partial(),
      responses: {
        200: z.custom<typeof scenarios.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  
  // Scenes
  scenes: {
    create: {
      method: 'POST' as const,
      path: '/api/scenes' as const,
      input: insertSceneSchema,
      responses: {
        201: z.custom<typeof scenes.$inferSelect>(),
      },
    },
  },

  // Chats (User-to-User)
  chats: {
    list: {
      method: 'GET' as const,
      path: '/api/chats' as const,
      responses: {
        200: z.array(z.custom<typeof chats.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/chats' as const,
      input: z.object({
        scenarioId: z.number().optional(),
        participantIds: z.array(z.string()), // user IDs to invite
        title: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof chats.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/chats/:id' as const,
      responses: {
        200: z.custom<typeof chats.$inferSelect & { participants: any[], messages: any[] }>(),
        404: errorSchemas.notFound,
      },
    },
    messages: {
      list: {
        method: 'GET' as const,
        path: '/api/chats/:id/messages' as const,
        responses: {
          200: z.array(z.custom<typeof chatMessages.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/chats/:id/messages' as const,
        input: z.object({
          content: z.string().optional(),
          type: z.enum(['text', 'voice', 'image', 'video']).default('text'),
          fileUrl: z.string().optional(),
          audioUrl: z.string().optional(),
        }),
        responses: {
          201: z.custom<typeof chatMessages.$inferSelect>(),
        },
      },
    }
  },

  // Avatars
  avatars: {
    list: {
      method: 'GET' as const,
      path: '/api/avatars' as const,
      responses: {
        200: z.array(z.custom<typeof avatars.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/avatars' as const,
      input: insertAvatarSchema,
      responses: {
        201: z.custom<typeof avatars.$inferSelect>(),
      },
    },
  },

  // Contacts
  contacts: {
    list: {
      method: 'GET' as const,
      path: '/api/contacts' as const,
      responses: {
        200: z.array(z.custom<typeof contacts.$inferSelect & { contact: typeof users.$inferSelect }>()),
      },
    },
    invite: {
      method: 'POST' as const,
      path: '/api/contacts/invite' as const,
      input: z.object({ username: z.string() }),
      responses: {
        201: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/contacts/:id' as const,
      input: z.object({ status: z.enum(['accepted', 'blocked']) }),
      responses: {
        200: z.custom<typeof contacts.$inferSelect>(),
      },
    },
  },
  
  // Library
  library: {
    list: {
      method: 'GET' as const,
      path: '/api/library' as const,
      responses: {
        200: z.array(z.custom<typeof libraryItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/library' as const,
      input: z.object({
        type: z.enum(['background', 'character']),
        name: z.string(),
        url: z.string(),
        scenarioId: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof libraryItems.$inferSelect>(),
      },
    },
  },

  // Users
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/users/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/me' as const,
      input: z.object({
        username: z.string().optional(),
        aboutMe: z.string().optional(),
        status: z.string().optional(),
        preferences: z.record(z.any()).optional(),
        profileImageUrl: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
  }
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
