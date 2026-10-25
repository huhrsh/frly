# Brevo email migration

Fryly uses the same direct transactional HTTP API as Dosia, with the existing
HTML templates and plain-text email callers. No Brevo SDK or SMTP credentials
are needed. There is no separate Twilio/SMS integration in this repository.

Update the backend environment (local process and production `backend/.env`):

```dotenv
BREVO_API_KEY=your-brevo-api-key
EMAIL_FROM_ADDRESS=your-verified-sender@example.com
```

Use a Brevo **API key**, not an SMTP key. Configure/verify the sender in the
Brevo account associated with that key. `EMAIL_FROM_ADDRESS` uses Dosia's naming;
the existing `MAIL_FROM` still works as a fallback if it is not set.

Remove `SENDGRID_API_KEY`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, and
`MAIL_PASSWORD`. You can also remove `MAIL_FROM` after setting
`EMAIL_FROM_ADDRESS`. All other environment variables remain as configured.
Never commit actual credentials.

Rebuild and restart the backend after updating its environment. Docker Compose
loads `backend/.env`; when running Maven directly, export the variables into the
process environment (Spring Boot does not load `.env` files automatically).

Verify delivery with a password-reset or group-invite email and inspect Brevo's
transactional email logs. Automated tests use a mock transport and send no emails.
Delivery remains best effort, as before: rejected/failed sends are logged without
throwing into existing callers. No automatic retries are added, to avoid duplicates.

API contract: https://developers.brevo.com/reference/send-transac-email
