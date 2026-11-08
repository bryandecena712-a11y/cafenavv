
## Password reset email

Password reset codes are sent through Gmail SMTP. Create a Google App Password for the sending Gmail account (Google Account 2-Step Verification is required), then configure these server-only environment variables locally and in Vercel:

- `GMAIL_USER`: the sending Gmail address
- `GMAIL_APP_PASSWORD`: that account's 16-character App Password

Do not use the account's normal Gmail password or expose either variable with a `NEXT_PUBLIC_` prefix. Apply the password-reset table migration to the PostgreSQL database before deploying the feature:

```sh
npx prisma migrate deploy
```

Codes are stored as bcrypt hashes, expire after 10 minutes, and allow at most five verification attempts.
