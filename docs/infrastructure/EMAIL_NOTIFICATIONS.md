# Email Notifications System

## Overview

Vysa sends two types of automated email notifications to users using Resend and React Email:

1. **Report Ready** - Sent when interview analysis completes
2. **Deletion Warning** - Sent 24 hours before report expires

---

## Technology Stack

- **Resend**: Email delivery service (reliable, developer-friendly)
- **React Email**: Component-based email templates (responsive, beautiful)
- **Next.js API Routes**: Server-side email sending

---

## Email Templates

### 1. Report Ready Email (`emails/report-ready.tsx`)

**Trigger**: Automatically sent after AI analysis completes

**Contains**:
- Personalized greeting with user's name
- Interview details (visa type, date)
- Overall score (0-100) in prominent display
- Color-coded recommendation badge:
  - 🟢 Green: Recommended for Approval
  - 🟡 Yellow: Needs Further Review  
  - 🔴 Red: Areas Need Improvement
- List of what's included in the report
- Prominent "View Your Report" CTA button
- 7-day expiration reminder
- Professional footer

**Design Features**:
- Responsive mobile design
- Brand colors (blue primary)
- Clean, modern layout
- Accessible HTML structure

### 2. Deletion Warning Email (`emails/deletion-warning.tsx`)

**Trigger**: Sent by daily cron job 24 hours before expiration

**Contains**:
- Urgent warning banner with countdown
- Interview details (visa type, date)
- List of what will be deleted
- Action required callout box
- "View Report Now" CTA button
- Explanation of why reports expire
- Professional footer

**Design Features**:
- Warning colors (orange/yellow)
- Urgent visual indicators
- Clear call-to-action
- Mobile responsive

---

## Implementation Details

### Email Utility (`lib/email.ts`)

Provides two main functions:

```typescript
// Send report ready email
await sendReportReadyEmail({
  to: "user@example.com",
  userName: "John",
  visaType: "Student Visa (F-1)",
  interviewDate: "January 15, 2024",
  interviewId: "interview-123",
  overallScore: 85,
  recommendation: "approve",
});

// Send deletion warning email
await sendDeletionWarningEmail({
  to: "user@example.com",
  userName: "John",
  visaType: "Student Visa (F-1)",
  interviewDate: "January 15, 2024",
  expirationDate: "January 22, 2024",
  interviewId: "interview-123",
  hoursRemaining: 24,
});
```

### Integration Points

#### 1. Report Ready (`app/api/interviews/session-report/route.ts`)

Sends email after saving AI report to database:

```typescript
// After report is saved...
const savedReport = await prisma.interviewReport.create({ ... });

// Send email notification
await sendReportReadyEmail({
  to: interview.user.email,
  userName: interview.user.firstName,
  // ... other details
});
```

#### 2. Deletion Warning (`app/api/cron/check-expiring-interviews/route.ts`)

Sends email during daily cron job:

```typescript
// Find interviews expiring in 24 hours
const expiringInterviews = await prisma.interview.findMany({
  where: {
    expiresAt: { gte: now, lte: oneDayFromNow },
    expirationWarningSent: false,
  },
});

// Send warning emails
for (const interview of expiringInterviews) {
  await sendDeletionWarningEmail({ ... });
  
  // Mark as sent
  await prisma.interview.update({
    where: { id: interview.id },
    data: { expirationWarningSent: true },
  });
}
```

---

## Setup Instructions

### 1. Create Resend Account

1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day, 3,000/month)
3. Verify your email address

### 2. Get API Key

1. Dashboard → API Keys
2. Click "Create API Key"
3. Name: "Vysa Production"
4. Copy the key (starts with `re_`)

### 3. Verify Domain (Production Only)

**For Development**: Skip this - use `onboarding@resend.dev` as sender

**For Production**:

1. Dashboard → Domains → Add Domain
2. Enter your domain (e.g., `vysa.app`)
3. Add these DNS records to your domain:

```
Type: TXT
Name: @
Value: [Resend verification code]

Type: TXT  
Name: resend._domainkey
Value: [DKIM key]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

4. Wait for verification (usually 5-15 minutes)

### 4. Add Environment Variables

Add to `.env.local` and production environment:

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# From email address
# Development: use onboarding@resend.dev
# Production: use your verified domain
RESEND_FROM_EMAIL="Vysa <noreply@yourdomain.com>"

# App URL for email links
NEXT_PUBLIC_APP_URL=https://vysa.app
```

### 5. Test in Development

```bash
# Start Next.js
npm run dev

# Complete an interview or trigger manually
# Check console for email sending logs
# Check Resend dashboard for delivery status
```

---

## Testing

### Test Report Ready Email

```bash
# 1. Complete a full interview
# 2. Wait for analysis to complete
# 3. Check your inbox for "Your Interview Report is Ready"
# 4. Verify:
#    - Email received within 1 minute
#    - Score and recommendation are correct
#    - "View Your Report" link works
#    - Email looks good on mobile
```

### Test Deletion Warning Email

```bash
# 1. Create or find an existing interview
# 2. Update expiration to tomorrow:
psql $DATABASE_URL -c "UPDATE \"Interview\" SET \"expiresAt\" = NOW() + INTERVAL '1 day', \"expirationWarningSent\" = false WHERE id = 'interview-id';"

# 3. Run cron job manually:
curl -X GET http://localhost:3000/api/cron/check-expiring-interviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 4. Check inbox for "Report Expires in 24 Hours"
# 5. Verify email content and links
```

### Test Email Rendering

Use React Email preview:

```bash
# Install React Email CLI
npm install -g @react-email/cli

# Preview emails
email dev
```

This opens a browser with live preview of all email templates.

---

## Monitoring

### Resend Dashboard

Track email performance:

1. **Sent**: Total emails sent
2. **Delivered**: Successfully delivered
3. **Opened**: User opened email (requires tracking pixel)
4. **Clicked**: User clicked links
5. **Bounced**: Failed deliveries
6. **Complained**: Spam reports

### Application Logs

Check server logs for:

```
✅ Report ready email sent to user@example.com: [message-id]
✅ Deletion warning email sent to user@example.com: [message-id]
⚠️ Failed to send report ready email: [error]
```

### Database Checks

Verify emails are being tracked:

```sql
-- Check if deletion warnings are being sent
SELECT 
  id, 
  "expiresAt", 
  "expirationWarningSent",
  "startedAt"
FROM "Interview"
WHERE "expiresAt" IS NOT NULL
ORDER BY "expiresAt" DESC;
```

---

## Troubleshooting

### Email Not Sending

**Check**:
1. `RESEND_API_KEY` is set correctly
2. API key has not been revoked
3. Check server logs for errors
4. Verify Resend dashboard shows attempt

**Fix**:
- Regenerate API key if needed
- Check rate limits (100/day free tier)
- Verify email addresses are valid

### Email Goes to Spam

**Check**:
1. Domain is verified in Resend
2. SPF, DKIM, DMARC records are correct
3. Email content is not triggering spam filters

**Fix**:
- Verify domain authentication
- Check email content (avoid spam keywords)
- Ask users to whitelist your domain

### Links Not Working

**Check**:
1. `NEXT_PUBLIC_APP_URL` is set correctly
2. Interview ID exists in database
3. Links include correct protocol (https://)

**Fix**:
- Update environment variable
- Test links manually

### Styling Issues on Mobile

**Test**:
- Use React Email preview tool
- Send test emails to different clients
- Check Gmail, Outlook, Apple Mail

**Fix**:
- Email templates use inline styles
- Tables for layout (email-safe)
- Tested on major email clients

---

## Best Practices

### Email Content

✅ **Do**:
- Keep subject lines under 50 characters
- Use clear, action-oriented CTAs
- Include unsubscribe link (required by law)
- Test on multiple email clients
- Personalize with user data

❌ **Don't**:
- Use JavaScript (not supported)
- Rely on external CSS
- Use large images (slows loading)
- Write all-caps subject lines
- Send from no-reply@ (use noreply@)

### Deliverability

✅ **Do**:
- Verify sender domain
- Set up SPF, DKIM, DMARC
- Monitor bounce rates
- Respect unsubscribe requests
- Send transactional emails only

❌ **Don't**:
- Buy email lists
- Send unsolicited marketing
- Ignore bounce notifications
- Use free email services as sender
- Send too frequently

### Performance

✅ **Do**:
- Handle email failures gracefully
- Use async/background jobs for bulk sends
- Log all email events
- Monitor delivery rates
- Set reasonable timeouts

❌ **Don't**:
- Block request while sending email
- Fail entire transaction if email fails
- Send emails synchronously in loops
- Retry failed emails indefinitely
- Store sensitive data in email logs

---

## Cost Estimates

### Resend Pricing

**Free Tier**:
- 100 emails/day
- 3,000 emails/month
- No credit card required

**Pro** ($20/month):
- 50,000 emails/month
- $1 per 1,000 additional
- Custom domains
- Priority support

**Enterprise** (Custom):
- Dedicated IP
- Advanced analytics
- SLA guarantees
- Volume discounts

### Typical Usage

Assuming 100 interviews/day:

- **Report Ready**: 100 emails/day = 3,000/month → **Free tier OK**
- **Deletion Warnings**: ~100 emails/day = 3,000/month → **Free tier OK**
- **Total**: ~6,000/month → **Need Pro plan ($20/month)**

---

## Future Enhancements

Potential improvements:

1. **Email Preferences**
   - Allow users to opt out of deletion warnings
   - Choose email frequency
   - SMS notifications alternative

2. **Rich Analytics**
   - Track which emails drive most engagement
   - A/B test subject lines
   - Optimize send times

3. **Additional Emails**
   - Welcome email on signup
   - Interview reminder (before scheduled interview)
   - Weekly summary of interviews
   - Tips and best practices newsletter

4. **Internationalization**
   - Translate emails based on user language
   - Localize dates and times
   - Support RTL languages

5. **Attachments**
   - Attach PDF report
   - Include transcript as attachment
   - Send certificate of completion

---

## Related Files

- `/emails/report-ready.tsx` - Report ready email template
- `/emails/deletion-warning.tsx` - Deletion warning email template
- `/lib/email.ts` - Email sending utility
- `/app/api/interviews/session-report/route.ts` - Report ready trigger
- `/app/api/cron/check-expiring-interviews/route.ts` - Deletion warning trigger

---

**Documentation Version**: 1.0  
**Last Updated**: December 6, 2025  
**Status**: Production Ready ✅



