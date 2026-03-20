import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/modules/auth/auth.service';

function createAuthService() {
  const sessions: any[] = [];
  const users: any[] = [];

  const prisma = {
    user: {
      findUnique: async ({ where }: any) => users.find((user) => user.email === where.email || user.id === where.id) ?? null,
      create: async ({ data }: any) => {
        const user = { id: 'user-1', ...data, status: 'active', createdAt: new Date() };
        users.push(user);
        return user;
      },
      update: async ({ where, data }: any) => {
        const user = users.find((item) => item.id === where.id);
        Object.assign(user, data);
        return user;
      },
    },
    authSession: {
      create: async ({ data }: any) => {
        const session = { id: `session-${sessions.length + 1}`, revokedAt: null, ...data };
        sessions.push(session);
        return session;
      },
      update: async ({ where, data }: any) => {
        const session = sessions.find((item) => item.id === where.id);
        Object.assign(session, data);
        return session;
      },
      updateMany: async ({ where, data }: any) => {
        sessions.filter((item) => item.id === where.id).forEach((session) => Object.assign(session, data));
        return { count: 1 };
      },
      findUnique: async ({ where }: any) => sessions.find((item) => item.id === where.id) ?? null,
    },
  } as any;

  const jwt = {
    signAsync: async (payload: any) => JSON.stringify(payload),
    verifyAsync: async (token: string) => JSON.parse(token),
  } as any;

  const config = { get: (key: string) => ({ JWT_REFRESH_EXPIRES_IN: '7d', JWT_ACCESS_EXPIRES_IN: '15m' } as Record<string, string>)[key] } as any;

  const service = new AuthService(prisma, jwt, config);
  return { service, sessions, users };
}

test('register/login/me/logout flow keeps session state consistent', async () => {
  const { service, sessions } = createAuthService();
  const registered = await service.register({ email: 'a@a.com', password: 'password123', firstName: 'Ana' } as any, {});
  assert.equal(typeof registered.accessToken, 'string');
  assert.equal(sessions.length, 1);

  const logged = await service.login({ email: 'a@a.com', password: 'password123' } as any, {});
  assert.equal(typeof logged.refreshToken, 'string');

  const me = await service.me(logged.user.id);
  assert.equal(me.email, 'a@a.com');

  await service.logout(logged.refreshToken);
  assert.notEqual(sessions[1].revokedAt, null);
});
