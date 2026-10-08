# Upload bucket

Product name: Upload bucket
Purpose: Share an upload link with friends, all of them can upload to it, only you can see everyone else's uploads.
Why: When you run events like a meetup or a wedding, you often want to collect all the pictures taken by participants in the event with their own mobile phones, but you don't want them to see each other's pictures for privacy reasons.

## Product features

1. Easy: the user creates an "event", they get a sharable link, they distribute this link and can lean back and wait until pictures are uploaded. Easy peasy.
2. Mobile-friendly: the frontend app interface for participants should be optimized for mobile in terms of performance and visual design.

## Product user personas

1. Organizer: this is the admin of the event. They create events, manage sharable links for uploads, and manage the events upload settings. The organizer can also upload files.
2. Attendee: this is the event's attendee. They receive a sharable link and have direct and straight-forward visual interface to upload files. They can see their own uploaded files, but not anyone else's.

## Product Capabilities

1. Organizer user type:
    1.1. As an organizer of events, I can create events, and delete them, so that I can collect files from users into an event and manage the event's lifecycle (create, delete).
    1.2. As an organizer of events, I can create unique links scoped to an event so that users can upload files to them.
    1.3. As an organizer who creates unique links to collect file uploads, I should be able to require that users must authenticate to the app in order to upload files.
    1.4. As an organizer who creates unique links to collect file uploads, I should be able to require that users may remain anonymous and the link becomes a magic link for their unique session to upload files. If they loose the temporary session created for them to upload the files, they won't be able to view/edit/delete their files.
    1.5. As an organizer who creates unique links to collect file uploads, I should be able to set uploads limits such as maximum file upload size, max number of files by user, and allowed file types.
2. Attendee user type:
    2.1. As an attendee invited to an event, I should be able to login with the app's configured authentication methods, or directly interact with the app if my sharable link allows anonymous sessions.
    2.2. As an attendee invited to an event, I should not be able to view/edit/delete any files of the event that do not belong to me. I should only access my own files, so that the application can keep all other attendee's files private.
3. The system:
    3.1. The system should have account tiers, specifically it should have a Freemium tier and a Pro tier.
    3.2. The system should enforce application-wide global limits for all user types, including: maximum file upload size, maximum number of files by users, maximum number of events created, maximum number of sharable links created, and a maximum number of attendees who login per event.
    3.3. The system should enforce the following limits for the Freemium tier: 10 total events created, 25 attendees per event, 10MB maximum file size, 50 files uploaded total per attendee per event.
    3.4. The system should enforce the following limits for the Freemium tier: 100 total events created, 1000 attendees per event, 25MB maximum file size, 250 files uploaded total per attendee per event.

## Product Visual Requirements

1. For organizers:
  1.1. The application should allow them to sign-in or sign-up
  1.2. The application should present them with an "admin"-like visual interface, allowing them CRUD, listing, and search capabilities for events.
2. For attnedees:
  2.1. The application should allow them to sign-in via authentication or a "anonymous sign-in" for a temporary user session
  2.2. Once signed in, the application should present them with a stripped-down, straight-forward, and clean visual interface that presents them the event details and a big upload button that allows them to choose multiple files from their device to upload.
    


## Shindig app

model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  projects   Project[]
  deletedAt DateTime?
  deleted Boolean @default(false)
}

model Project {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String   @db.VarChar(255)
  description   String?
  owner    User     @relation(fields: [ownerId], references: [id])
  ownerId  Int
  certificates Certificate[]
}

model Certificate {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String   @db.VarChar(255)
  content   String?
  published Boolean  @default(false)
  project    Project     @relation(fields: [projectId], references: [id])
  projectId  Int
}

