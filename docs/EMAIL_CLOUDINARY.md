# EmailJS + Cloudinary setup (MarketLink)

## EmailJS (forgot-password OTP + order confirmation)

1. Create an account at https://dashboard.emailjs.com/
2. Add an **Email Service** (Gmail / Outlook / etc.) → copy **Service ID**
3. Create **one Email Template** with these variables (exact names):

```
Subject: {{subject}}

Hello {{to_name}},

{{heading}}

{{intro}}

{{otp_code}}

{{details}}

{{footer_note}}

— {{app_name}}
```

In the template **To** field use: `{{to_email}}`  
(Optional) Subject field: `{{subject}}`

4. Copy **Template ID** and **Public Key** (Account → General)
5. Put values in `.env`:

```
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

6. Run SQL migration `supabase/migrations/004_password_otp.sql` in Supabase SQL Editor
   (stores OTP securely; RPC completes password reset after EmailJS delivers the code)

**Flows**
- Forgot password → EmailJS sends OTP → user enters OTP + new password → DB RPC updates auth password
- Checkout → EmailJS sends order confirmation (same template; `otp_code` left empty)
- Contact page → inserts `contact_messages` + EmailJS to admin (`VITE_CONTACT_TO_EMAIL` or default `foraptech080@gmail.com`); `otp_code` empty; `details` = visitor message; `intro` identifies sender name/email

Optional env:

```
VITE_CONTACT_TO_EMAIL=foraptech080@gmail.com
```

---

## Cloudinary (dashboard image upload)

1. Cloudinary console → **Settings → Upload → Upload presets**
2. Add an **unsigned** preset (Signing mode: Unsigned)
3. Copy **Cloud name** and **Upload preset** name
4. `.env`:

```
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
VITE_CLOUDINARY_FOLDER=marketlink
```

Farmer product form and profile/settings avatar use **Choose image** → uploads to Cloudinary → saves `secure_url` in `products.image_url` or `profiles.avatar_url`.
