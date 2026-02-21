# Space Booking — Setup Guide

This guide walks you through connecting the booking page to Notion, Stripe, and email in about 30 minutes.

---

## What you'll have when done

```
Customer fills form
       ↓
Backend creates Notion page (Status = Pending)
       ↓
Team gets email → clicks link → opens Notion
       ↓
Team changes Status dropdown → "Approved" or "Denied"
       ↓
Backend detects change (within 15s) →
  Approved: creates Stripe Checkout link → emails customer
  Denied:   emails customer
       ↓
Customer pays via Stripe
       ↓
Notion Status updates to "Paid" automatically
```

---

## Step 1 — Create your Notion database

1. Open Notion and create a new **full-page database** (Table view). Name it something like `Space Bookings`.

2. Add these properties (column names must match exactly):

| Property Name | Type |
|---|---|
| Name | Title (already exists) |
| Booking Ref | Text |
| **Status** | **Select** |
| Email | Email |
| Phone | Phone |
| Organization | Text |
| Event Type | Select |
| Date | Text |
| Start Time | Text |
| End Time | Text |
| Duration (hrs) | Number |
| Attendees | Number |
| Total Amount | Number |
| House Rules Agreed | Checkbox |
| Amplified Sound | Select |
| Equipment | Text |
| How They Found Us | Select |
| Stripe Checkout URL | URL |
| Stripe Session ID | Text |
| Stripe Payment ID | Text |

3. For the **Status** property, add these exact options:
   - `Pending` (yellow)
   - `Approved` (green)
   - `Denied` (red)
   - `Paid` (blue)

4. Copy your **Database ID** from the URL:
   `https://notion.so/yourworkspace/DATABASE_ID_HERE?v=...`
   It's the 32-character string before the `?`.

---

## Step 2 — Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name: `Space Booking`
4. Set capabilities: **Read content**, **Update content**, **Insert content**
5. Click **Save** → copy the **Internal Integration Token** (starts with `secret_`)

6. Back in your Notion database, click the **"..."** menu → **"+ Add connections"** → select your `Space Booking` integration.

---

## Step 3 — Set up Stripe

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your **Secret key** from Developers → API keys (use `sk_live_...` for production, `sk_test_...` for testing)
3. For webhooks: Developers → Webhooks → **Add endpoint**
   - URL: `https://your-backend.com/api/stripe-webhook`
   - Events to listen for: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`)

---

## Step 4 — Set up email (Gmail example)

**If using Gmail:**
1. Enable 2-factor auth on your Google account
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an app password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

**Recommended alternatives** (easier for production):
- [Resend](https://resend.com) — generous free tier, great deliverability
- [SendGrid](https://sendgrid.com) — 100 emails/day free
- [Postmark](https://postmarkapp.com) — best deliverability

---

## Step 5 — Configure and run the backend

```bash
# 1. Go into the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in your values
cp .env.example .env
nano .env   # or open in any editor

# 4. Start the server
npm start
```

Your `.env` should look like:
```
NOTION_TOKEN=secret_abc123...
NOTION_DATABASE_ID=abc123def456...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=bookings@yourdomain.com
TEAM_EMAIL=team@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

## Step 6 — Update the booking page

Open `space-booking.html` and update the `BACKEND_URL` constant at the top of the script:

```js
const BACKEND_URL = 'https://your-backend.com'; // your deployed backend URL
```

---

## Step 7 — Deploy (options)

**Backend** (choose one):
- **Railway** — easiest, ~$5/mo. Connect your GitHub repo, add env vars in dashboard.
- **Render** — free tier available (spins down after inactivity)
- **Fly.io** — great free tier, more control
- **DigitalOcean App Platform** — $5/mo, very reliable

**Frontend** (`space-booking.html`):
- Drop it in your existing website, or
- Host on **Netlify Drop** (drag & drop the file at netlify.com/drop), or
- Any static host (GitHub Pages, Vercel, Cloudflare Pages)

---

## How the approval flow works day-to-day

1. A booking request comes in → you get an email with a link to the Notion page
2. Open Notion → review the details in the page body
3. Change the **Status** dropdown from `Pending` to `Approved` or `Denied`
4. Within ~15 seconds, the backend detects the change:
   - **Approved** → Stripe Checkout link is created and emailed to the customer
   - **Denied** → Denial email is sent to the customer
5. Customer pays → Status automatically changes to `Paid`

That's it — your whole approval workflow lives in Notion. You can also filter/sort bookings, add notes to pages, @mention teammates, etc.

---

## Testing checklist

- [ ] Submit a test booking → check Notion for the new row + page
- [ ] Check team email arrived
- [ ] Check customer confirmation email arrived
- [ ] Change Status to `Approved` in Notion → wait 15s → check customer email for Stripe link
- [ ] Complete test payment with Stripe test card `4242 4242 4242 4242`
- [ ] Check Notion status updated to `Paid`
- [ ] Test denial flow too

---

## Troubleshooting

**Notion page not created:** Check that your integration is connected to the database (Step 2, point 6) and that `NOTION_DATABASE_ID` is correct.

**Emails not sending:** Test your SMTP credentials with a tool like [smtp-tester.com](https://smtp-tester.com). For Gmail, make sure you're using an App Password, not your regular password.

**Status changes not detected:** Make sure the backend is running and has no errors in the console. The watcher runs every 15 seconds.

**Stripe webhook not working:** For local testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3001/api/stripe-webhook`
