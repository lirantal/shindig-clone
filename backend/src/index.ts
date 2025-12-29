import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/better-auth'
import uploads from './routes/uploads'
import profile from './routes/profile'
import notifications from './routes/notifications'

const app = new Hono<{ Bindings: Env }>()

// CORS middleware for cross-origin requests
app.use('*', cors({
  origin: '*', // Allow all origins initially
  credentials: true, // Allow cookies to be sent cross-origin
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Mount Better Auth handler
app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth(c.env).handler(c.req.raw)
})

// Mount uploads routes
app.route('/api/uploads', uploads)

// Mount profile routes
app.route('/api/user', profile)

// Mount notifications routes
app.route('/api/user', notifications)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
