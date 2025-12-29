import { Hono } from 'hono'
import { auth } from '../lib/better-auth'
import { eq } from 'drizzle-orm'
import { userNotifications } from '../db/schema'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const notifications = new Hono<{ Bindings: Env }>()

// Helper function to get database connection
const getDb = (env: Env) => {
  const sql = neon(env.DATABASE_URL)
  return drizzle(sql)
}

// GET /api/user/notifications - Fetch current user notification preferences
notifications.get('/notifications', async (c) => {
  try {
    // Validate authentication
    const session = await auth(c.env).api.getSession({
      headers: c.req.raw.headers
    })

    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Get user notifications from database
    const db = getDb(c.env)
    const notificationsRecord = await db.select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, session.user.id))
      .limit(1)

    // If no record exists, create one with defaults
    if (notificationsRecord.length === 0) {
      const newId = crypto.randomUUID()
      const defaultNotifications = {
        id: newId,
        userId: session.user.id,
        email: true,
        desktop: false,
        productUpdates: true,
        weeklyDigest: false,
        importantUpdates: true
      }

      const [created] = await db.insert(userNotifications)
        .values(defaultNotifications)
        .returning()

      return c.json({
        email: created.email,
        desktop: created.desktop,
        product_updates: created.productUpdates,
        weekly_digest: created.weeklyDigest,
        important_updates: created.importantUpdates
      })
    }

    const notificationData = notificationsRecord[0]

    // Return notification preferences (map camelCase to snake_case for frontend)
    return c.json({
      email: notificationData.email,
      desktop: notificationData.desktop,
      product_updates: notificationData.productUpdates,
      weekly_digest: notificationData.weeklyDigest,
      important_updates: notificationData.importantUpdates
    })

  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return c.json({ 
      error: 'Internal server error' 
    }, 500)
  }
})

// POST /api/user/notifications - Update user notification preferences
notifications.post('/notifications', async (c) => {
  try {
    // Validate authentication
    const session = await auth(c.env).api.getSession({
      headers: c.req.raw.headers
    })

    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Parse request body
    const body = await c.req.json()
    const { email, desktop, product_updates, weekly_digest, important_updates } = body

    // Validate all fields are booleans if provided
    const validationErrors: string[] = []
    
    if (email !== undefined && typeof email !== 'boolean') {
      validationErrors.push('email must be a boolean')
    }
    if (desktop !== undefined && typeof desktop !== 'boolean') {
      validationErrors.push('desktop must be a boolean')
    }
    if (product_updates !== undefined && typeof product_updates !== 'boolean') {
      validationErrors.push('product_updates must be a boolean')
    }
    if (weekly_digest !== undefined && typeof weekly_digest !== 'boolean') {
      validationErrors.push('weekly_digest must be a boolean')
    }
    if (important_updates !== undefined && typeof important_updates !== 'boolean') {
      validationErrors.push('important_updates must be a boolean')
    }

    if (validationErrors.length > 0) {
      return c.json({ 
        error: 'Validation failed',
        details: validationErrors
      }, 400)
    }

    // Update or insert user notifications
    const db = getDb(c.env)
    
    // Check if record exists
    const existingRecord = await db.select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, session.user.id))
      .limit(1)

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    // Only update fields that are provided
    if (email !== undefined) updateData.email = email
    if (desktop !== undefined) updateData.desktop = desktop
    if (product_updates !== undefined) updateData.productUpdates = product_updates
    if (weekly_digest !== undefined) updateData.weeklyDigest = weekly_digest
    if (important_updates !== undefined) updateData.importantUpdates = important_updates

    let updatedNotifications

    if (existingRecord.length === 0) {
      // Create new record with provided values and defaults
      const newId = crypto.randomUUID()
      const insertData = {
        id: newId,
        userId: session.user.id,
        email: email !== undefined ? email : true,
        desktop: desktop !== undefined ? desktop : false,
        productUpdates: product_updates !== undefined ? product_updates : true,
        weeklyDigest: weekly_digest !== undefined ? weekly_digest : false,
        importantUpdates: important_updates !== undefined ? important_updates : true
      }

      const [created] = await db.insert(userNotifications)
        .values(insertData)
        .returning()

      updatedNotifications = created
    } else {
      // Update existing record
      const [updated] = await db.update(userNotifications)
        .set(updateData)
        .where(eq(userNotifications.userId, session.user.id))
        .returning()

      updatedNotifications = updated
    }

    // Return updated notification preferences
    return c.json({
      success: true,
      email: updatedNotifications.email,
      desktop: updatedNotifications.desktop,
      product_updates: updatedNotifications.productUpdates,
      weekly_digest: updatedNotifications.weeklyDigest,
      important_updates: updatedNotifications.importantUpdates
    })

  } catch (error) {
    console.error('Error updating user notifications:', error)
    return c.json({ 
      error: 'Internal server error' 
    }, 500)
  }
})

export default notifications

