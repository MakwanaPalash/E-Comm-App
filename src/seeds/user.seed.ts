export const UserSeed = {
  firstName: 'Super',
  lastName: 'Admin',
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  password: process.env.ADMIN_PASSWORD || 'admin123456',
  role: 'ADMIN' as const,
};
