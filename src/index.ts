import { Hono } from 'hono'
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';

export const app = new Hono<{
  Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
  }
}>();

app.route('/api/v1/user', userRouter)
app.route('/api/v1/admin', adminRouter)

export default app
