/**
 * Space Rental Booking Backend
 * ─────────────────────────────
 * Routes:
 *   POST /api/booking-request        ← receives form submission, writes to Notion
 *   GET  /api/booking-status/:pageId ← frontend polls this every 10s
 *   POST /api/stripe-webhook         ← Stripe confirms payment, updates Notion
 *
 * Dependencies:
 *   npm install express cors @notionhq/client stripe nodemailer dotenv
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const { Client } = require('@notionhq/client');
const Stripe    = require('stripe');
const nodemailer = require('nodemailer');

const app    = express();
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
// Raw body for Stripe webhook signature verification
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── Email Transport ──────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// ─── Helpers ──────────────────────────────────────────────────
function bookingRef() {
  return 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function sendMail(to, subject, html) {
  try {
    await mailer.sendMail({ from: process.env.FROM_EMAIL, to, subject, html });
  } catch (e) {
    console.error('Email error:', e.message);
  }
}

// ─── POST /api/booking-request ────────────────────────────────
// 1. Creates a Notion page (row in database + full detail page)
// 2. Emails your team with a link to the Notion page
// 3. Emails customer a confirmation that request is under review
app.post('/api/booking-request', async (req, res) => {
  const b = req.body;
  const ref = bookingRef();

  try {
    // ── Create Notion page ──────────────────────────────────
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      icon: { type: 'emoji', emoji: '📋' },

      // ── Database properties (visible as columns in table view) ──
      properties: {
        // Title (Name column — required)
        'Name': {
          title: [{ text: { content: `${b.firstName} ${b.lastName} — ${b.eventType}` } }]
        },
        'Booking Ref': {
          rich_text: [{ text: { content: ref } }]
        },
        'Status': {
          // Must match your Notion select options exactly
          select: { name: 'Pending' }
        },
        'Email': {
          email: b.email
        },
        'Phone': {
          phone_number: b.phone
        },
        'Organization': {
          rich_text: [{ text: { content: b.org || '' } }]
        },
        'Event Type': {
          select: { name: b.eventType }
        },
        'Date': {
          rich_text: [{ text: { content: b.date } }]
        },
        'Start Time': {
          rich_text: [{ text: { content: b.startTime } }]
        },
        'End Time': {
          rich_text: [{ text: { content: b.endTime } }]
        },
        'Duration (hrs)': {
          number: Number(b.durationHours)
        },
        'Attendees': {
          number: Number(b.attendees)
        },
        'Total Amount': {
          number: Number(b.totalAmount)
        },
        'House Rules Agreed': {
          checkbox: b.houseRulesAgreed === true
        },
        'Amplified Sound': {
          select: { name: b.sound }
        },
        'Equipment': {
          rich_text: [{ text: { content: (b.equipment || []).join(', ') } }]
        },
        'How They Found Us': {
          select: { name: b.referral }
        },
      },

      // ── Page body (rich detail view when you click the row) ──
      children: [
        {
          object: 'block', type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: '📝 Event Description' } }] }
        },
        {
          object: 'block', type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: b.description || '(none provided)' } }] }
        },
        { object: 'block', type: 'divider', divider: {} },
        {
          object: 'block', type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: '✅ Approval Instructions' } }] }
        },
        {
          object: 'block', type: 'callout',
          callout: {
            icon: { type: 'emoji', emoji: '👆' },
            rich_text: [{ text: { content: `Change the Status property above to "Approved" or "Denied". The system will automatically notify ${b.firstName} by email within 10 seconds.` } }]
          }
        },
        { object: 'block', type: 'divider', divider: {} },
        {
          object: 'block', type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: '💳 Billing' } }] }
        },
        {
          object: 'block', type: 'paragraph',
          paragraph: {
            rich_text: [{
              text: { content: `${b.durationHours} hrs × $75/hr = $${b.totalAmount} USD\nA Stripe Checkout link will be generated and emailed automatically on approval.` }
            }]
          }
        },
      ]
    });

    // ── Notify team ─────────────────────────────────────────
    const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`;
    await sendMail(
      process.env.TEAM_EMAIL,
      `🏢 New Space Booking Request — ${b.firstName} ${b.lastName} (${ref})`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#C4572A">New Booking Request</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;color:#888;font-size:13px">Ref</td><td style="padding:8px"><strong>${ref}</strong></td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Name</td><td style="padding:8px">${b.firstName} ${b.lastName}</td></tr>
            <tr><td style="padding:8px;color:#888;font-size:13px">Email</td><td style="padding:8px">${b.email}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Event</td><td style="padding:8px">${b.eventType}</td></tr>
            <tr><td style="padding:8px;color:#888;font-size:13px">Date</td><td style="padding:8px">${b.date}, ${b.startTime}–${b.endTime}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Attendees</td><td style="padding:8px">${b.attendees}</td></tr>
            <tr><td style="padding:8px;color:#888;font-size:13px">House Rules</td><td style="padding:8px">✓ All rules agreed</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Amount</td><td style="padding:8px"><strong>$${b.totalAmount}</strong></td></tr>
          </table>
          <br>
          <a href="${notionUrl}" style="display:inline-block;background:#C4572A;color:white;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:bold">
            Review &amp; Approve in Notion →
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">
            Change the <strong>Status</strong> field to <strong>Approved</strong> or <strong>Denied</strong>.<br>
            The system will automatically email ${b.firstName} within 10 seconds.
          </p>
        </div>
      `
    );

    // ── Confirm to customer ──────────────────────────────────
    await sendMail(
      b.email,
      `Your booking request is under review — ${ref}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#C4572A">We've received your request!</h2>
          <p>Hi ${b.firstName},</p>
          <p>Your space rental request (<strong>${ref}</strong>) is being reviewed by our team. 
             We'll respond within 24 hours.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Event</td><td style="padding:8px">${b.eventType}</td></tr>
            <tr><td style="padding:8px;color:#888;font-size:13px">Date</td><td style="padding:8px">${b.date}, ${b.startTime}–${b.endTime}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Total (if approved)</td><td style="padding:8px">$${b.totalAmount}</td></tr>
          </table>
          <p style="color:#888;font-size:13px">Questions? Reply to this email.</p>
        </div>
      `
    );

    res.json({ ok: true, notionPageId: page.id, ref });

  } catch (err) {
    console.error('Booking submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/booking-status/:pageId ─────────────────────────
// Frontend polls this every 10s to check if team changed Status in Notion
app.get('/api/booking-status/:pageId', async (req, res) => {
  try {
    const page = await notion.pages.retrieve({ page_id: req.params.pageId });
    const status = page.properties['Status']?.select?.name || 'Pending';
    const stripeUrl = page.properties['Stripe Checkout URL']?.url || null;
    res.json({ status, stripeUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Notion Status Watcher ────────────────────────────────────
// Polls Notion every 15s for any Pending → Approved/Denied transitions
// and triggers Stripe + email automatically
const processedPages = new Set(); // avoid double-processing

async function watchNotionForApprovals() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        or: [
          { property: 'Status', select: { equals: 'Approved' } },
          { property: 'Status', select: { equals: 'Denied' } },
        ]
      }
    });

    for (const page of response.results) {
      if (processedPages.has(page.id)) continue;

      const props = page.properties;
      const status    = props['Status']?.select?.name;
      const email     = props['Email']?.email;
      const firstName = props['Name']?.title?.[0]?.plain_text?.split(' ')[0] || 'there';
      const ref       = props['Booking Ref']?.rich_text?.[0]?.plain_text || '';
      const eventType = props['Event Type']?.select?.name || '';
      const date      = props['Date']?.rich_text?.[0]?.plain_text || '';
      const startTime = props['Start Time']?.rich_text?.[0]?.plain_text || '';
      const endTime   = props['End Time']?.rich_text?.[0]?.plain_text || '';
      const amount    = props['Total Amount']?.number || 0;
      const alreadyHasStripe = props['Stripe Checkout URL']?.url;

      if (!email || alreadyHasStripe) { processedPages.add(page.id); continue; }

      processedPages.add(page.id);

      if (status === 'Approved') {
        // ── Create Stripe Checkout Session ──────────────────
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: `Space Rental — ${eventType}`,
                description: `${date}, ${startTime}–${endTime} | Ref: ${ref}`
              }
            },
            quantity: 1
          }],
          customer_email: email,
          metadata: { notionPageId: page.id, ref },
          success_url: `${process.env.FRONTEND_URL}/booking-confirmed?ref=${ref}`,
          cancel_url:  `${process.env.FRONTEND_URL}/booking-cancelled`,
        });

        // ── Save Stripe URL back to Notion page ─────────────
        await notion.pages.update({
          page_id: page.id,
          properties: {
            'Stripe Checkout URL': { url: session.url },
            'Stripe Session ID':   { rich_text: [{ text: { content: session.id } }] }
          }
        });

        // ── Email customer with payment link ─────────────────
        await sendMail(
          email,
          `✅ Your booking is approved — pay to confirm (${ref})`,
          `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#4A6741">Your booking has been approved!</h2>
              <p>Hi ${firstName},</p>
              <p>Great news — your space rental request <strong>${ref}</strong> has been approved.
                 Complete payment within 48 hours to secure your spot.</p>
              <table style="width:100%;border-collapse:collapse;margin:24px 0">
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Event</td><td style="padding:8px">${eventType}</td></tr>
                <tr><td style="padding:8px;color:#888;font-size:13px">Date & Time</td><td style="padding:8px">${date}, ${startTime}–${endTime}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">Total Due</td><td style="padding:8px"><strong>$${amount}</strong></td></tr>
              </table>
              <a href="${session.url}" style="display:inline-block;background:#4A6741;color:white;padding:16px 32px;border-radius:4px;text-decoration:none;font-size:16px;font-weight:bold">
                Pay $${amount} Securely →
              </a>
              <p style="color:#888;font-size:12px;margin-top:24px">
                This link expires in 24 hours. Powered by Stripe — your card details are never shared with us.
              </p>
            </div>
          `
        );
        console.log(`✅ Approved & Stripe link sent: ${ref}`);

      } else if (status === 'Denied') {
        await sendMail(
          email,
          `Your booking request — ${ref}`,
          `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#8C8580">Booking request update</h2>
              <p>Hi ${firstName},</p>
              <p>Unfortunately we're unable to accommodate your request (<strong>${ref}</strong>) at this time.
                 You're welcome to submit a new request for a different date.</p>
              <p style="color:#888;font-size:13px">Questions? Reply to this email and we'll be happy to help.</p>
            </div>
          `
        );
        console.log(`🚫 Denied & email sent: ${ref}`);
      }
    }
  } catch (err) {
    console.error('Notion watcher error:', err.message);
  }
}

// Run watcher every 15 seconds
setInterval(watchNotionForApprovals, 15000);

// ─── POST /api/stripe-webhook ─────────────────────────────────
// Stripe calls this when payment completes — updates Notion to "Paid"
app.post('/api/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const notionPageId = session.metadata?.notionPageId;
    const ref = session.metadata?.ref;

    if (notionPageId) {
      await notion.pages.update({
        page_id: notionPageId,
        properties: {
          'Status':           { select: { name: 'Paid' } },
          'Stripe Payment ID': { rich_text: [{ text: { content: session.payment_intent || '' } }] }
        }
      });
      console.log(`💳 Payment confirmed in Notion: ${ref}`);
    }
  }

  res.json({ received: true });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Booking backend running on port ${PORT}`);
  console.log(`📋 Notion DB: ${process.env.NOTION_DATABASE_ID}`);
  console.log(`👁️  Watching Notion for approvals every 15s…`);
});
