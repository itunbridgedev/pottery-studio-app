# Apple ID OAuth Setup Guide

This guide explains how to configure Apple Sign In (OAuth) for the Kiln Agent app.

## Prerequisites

- Apple Developer Account ($99/year)
- Registered app with Apple
- Access to Apple Developer Console

## Overview

Apple Sign In uses OAuth 2.0 with JWT-based authentication. Unlike Google OAuth which uses OAuth 2.0 with traditional secrets, Apple requires:

- Service ID (Client ID)
- Team ID
- Key ID
- Private Key (.p8 file)

## Step 1: Create an App ID

1. Go to [Apple Developer Console](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** and click **Continue**
5. Configure:
   - **Description**: Kiln Agent
   - **Bundle ID**: `com.kilnagent.app` (use your domain)
   - **Capabilities**: Enable **Sign in with Apple**
6. Click **Continue** and **Register**

## Step 2: Create a Services ID

1. In **Identifiers**, click **+** button
2. Select **Services IDs** and click **Continue**
3. Configure:
   - **Description**: Kiln Agent Web Service
   - **Identifier**: `com.kilnagent.web` (this is your Client ID)
4. Click **Continue** and **Register**
5. Click on the newly created Services ID
6. Enable **Sign in with Apple**
7. Click **Configure**:
   - **Primary App ID**: Select your App ID from Step 1
   - **Domains and Subdomains**: `kilnagent.com` (production domain only)
   - **Return URLs**: `https://kilnagent.com/api/auth/apple/callback` (must use HTTPS)
8. Click **Save**, then **Continue**, then **Register**

**Important Notes**:

- Apple **requires HTTPS** for all Return URLs except `localhost`
- Custom domains (like `kilnagentdev.com`) **cannot use HTTP** - Apple rejects them
- Only `localhost` can use `http://` protocol
- For production, always use `https://`
- You cannot test Apple Sign In locally with custom domains unless you set up local HTTPS

**For Local Development Testing**:

**Apple Sign In requires HTTPS for all domains except `localhost`.** You have three options:

**Option 1: Test on Production (Recommended)**

- Configure only production domain in Apple Services ID
- Deploy and test on your live server with HTTPS

**Option 2: Use localhost (Limited)**

- This works, but you can't use a custom domain locally
- Domain: Leave empty or use production domain
- Return URL: You can try `http://localhost:4000/api/auth/apple/callback` but Apple may still reject it
- Access app at `http://localhost:3000`

**Option 3: Set up Local HTTPS (Advanced)**

1. Use a tool like [mkcert](https://github.com/FiloSottile/mkcert) to create local SSL certificates
2. Configure your development server to use HTTPS
3. Add `https://kilnagentdev.com:4000/api/auth/apple/callback` to Apple
4. Add `127.0.0.1  kilnagentdev.com` to `/etc/hosts`
5. Access at `https://kilnagentdev.com:3000`

**Recommended Approach:**
Test Apple Sign In on your production server at `https://kilnagent.com` where HTTPS is already configured. Development testing with Apple OAuth is challenging due to their HTTPS requirement.

## Step 3: Create a Private Key

1. Navigate to **Keys** section
2. Click **+** button
3. Configure:
   - **Key Name**: Kiln Agent Sign In Key
   - **Enable**: Check **Sign in with Apple**
4. Click **Configure** next to Sign in with Apple
5. Select your **Primary App ID**
6. Click **Save**, then **Continue**
7. Click **Register**
8. **Download** the key file (`.p8` file) - you can only download this once!
9. Note the **Key ID** (e.g., `ABC123DEF4`)

## Step 4: Get Your Team ID

1. In Apple Developer Console, click your name in the top right
2. Go to **Membership**
3. Find your **Team ID** (e.g., `XYZ987WVU6`)

## Step 5: Configure Environment Variables

Add these to your `.env` file in the `/api` directory:

```bash
# Apple OAuth Configuration
APPLE_CLIENT_ID=com.kilnagent.web
APPLE_TEAM_ID=XYZ987WVU6
APPLE_KEY_ID=ABC123DEF4
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(paste your entire .p8 key content here)
...
-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=http://localhost:4000/api/auth/apple/callback

# Other existing variables
CLIENT_URL=http://localhost:3000
```

### Important Notes on Private Key:

**Option 1: Single Line (Recommended for .env)**
Replace newlines with `\n`:

```bash
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEA...\n-----END PRIVATE KEY-----"
```

**Option 2: Multi-line (Using quotes)**

```bash
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
```

### How to Convert .p8 to Single Line:

```bash
# On macOS/Linux
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' AuthKey_ABC123DEF4.p8
```

## Step 6: Test the Integration

### Development Testing

1. Rebuild the API container:

```bash
docker compose up -d --build api
```

2. Visit: http://localhost:3000/login

3. Click **Continue with Apple**

4. You'll be redirected to Apple's login page

5. Sign in with your Apple ID

6. On first sign-in, you'll be asked to:

   - Share your email
   - Optionally share your name
   - Choose to hide or share your real email

7. After authorization, you'll be redirected back to your app

### Verify in Database

```bash
# Connect to Prisma Studio
cd api
npm run studio
```

Check:

- **Customer** table has new user
- **Account** table has provider = "apple"

## Apple Sign In Behavior

### First-Time Sign In

- User sees Apple login screen
- Can choose to hide email (Apple provides relay email)
- Name is shared only on first sign-in
- App receives: email, name (if shared), Apple ID

### Subsequent Sign Ins

- User sees consent screen again
- Name is **not** provided (already shared)
- Only email and Apple ID returned

### Email Privacy

If user chooses "Hide My Email":

- Apple provides a relay email: `abc123@privaterelay.appleid.com`
- Emails sent to this address forward to user's real email
- This relay email is unique per app

## Troubleshooting

### Error: "Invalid client"

**Solution**: Verify `APPLE_CLIENT_ID` matches your Services ID identifier exactly.

### Error: "Invalid key"

**Solutions**:

- Ensure private key includes header and footer
- Check for proper newline formatting (`\n`)
- Verify no extra spaces or characters
- Make sure Key ID matches the downloaded key

### Error: "Invalid redirect URI"

**Solutions**:

- Apple web authentication **does not accept** `localhost` in the Domains field
- **For Development with localhost**:
  - Leave "Domains and Subdomains" field **empty**
  - Only add Return URL: `http://localhost:4000/api/auth/apple/callback`
  - Apple may show a validation warning - click **Save** or **Done** anyway
- **Alternative for Development** (if localhost is blocked):

  - Use a hosts file entry: Add `127.0.0.1  local.kilnagent.dev` to `/etc/hosts`
  - Domain: `local.kilnagent.dev`
  - Return URL: `http://local.kilnagent.dev:4000/api/auth/apple/callback`

- **For Production**:
  - Domain: `yourdomain.com` (no www, no port)
  - Return URL: `https://yourdomain.com/api/auth/apple/callback`
  - HTTPS is required

**Common Issues**:

- ❌ Domain: `localhost` → Apple rejects this
- ❌ Domain: `localhost:4000` → Never include ports
- ✅ Domain: (empty) → Works for localhost testing
- ✅ Return URL: `http://localhost:4000/api/auth/apple/callback` → This is fine

### Error: "User cancelled"

**Solution**: This is normal - user clicked "Cancel" on Apple's login screen.

### Name not appearing

**Expected behavior**: Apple only provides name on first authorization. Store it in your database.

### Email not appearing

**Check**:

- Ensure "email" is in the requested scopes
- User must grant email permission
- If hidden, you'll get a relay email

## Production Deployment

### 1. Update Apple Services ID

1. Go to Services ID in Apple Developer Console
2. Add production domain to **Domains and Subdomains**
3. Add production callback URL:
   ```
   https://api.yourdomain.com/api/auth/apple/callback
   ```

### 2. Update Environment Variables

```bash
APPLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/apple/callback
CLIENT_URL=https://yourdomain.com
```

### 3. HTTPS Required

Apple requires HTTPS for production callback URLs. Development (localhost) can use HTTP.

## Security Best Practices

### 1. Protect Private Key

- **Never** commit `.p8` file to git
- **Never** commit `.env` with keys to git
- Add to `.gitignore`:
  ```
  .env
  .env.local
  *.p8
  ```

### 2. Key Rotation

- Generate new keys periodically
- Apple allows multiple active keys
- Update `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY` in env

### 3. Environment Separation

Use different Services IDs for development/staging/production:

- `com.kilnagent.web.dev`
- `com.kilnagent.web.staging`
- `com.kilnagent.web.prod`

## Testing Checklist

- [ ] Apple button appears on login page
- [ ] Clicking button redirects to Apple login
- [ ] Can sign in with Apple ID
- [ ] User is created in database
- [ ] Account record created with provider="apple"
- [ ] User redirected back to app after sign-in
- [ ] User session persists (check /api/auth/me)
- [ ] Can logout and sign in again
- [ ] Existing user with same email can sign in with Apple
- [ ] Hidden email (relay) works correctly

## API Endpoints

### Initiate Apple Sign In

```
POST /api/auth/apple
```

Redirects to Apple's OAuth page.

### Apple Callback

```
POST /api/auth/apple/callback
```

Handles Apple's response after user authorization.

## Code Implementation

### Backend: passport.ts

```typescript
import { Strategy as AppleStrategy } from "passport-apple";

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID!,
      privateKeyString: process.env.APPLE_PRIVATE_KEY!,
      callbackURL: process.env.APPLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, idToken, profile, done) => {
      // Create or update user
    }
  )
);
```

### Frontend: AuthContext.tsx

```typescript
const loginWithApple = () => {
  window.location.href = "/api/auth/apple";
};
```

### Frontend: Login Page

```tsx
<button onClick={loginWithApple} className="apple-login-btn">
  <AppleIcon />
  Continue with Apple
</button>
```

## Database Schema

The existing schema supports Apple OAuth:

```prisma
model Account {
  id                String    @id @default(cuid())
  customerId        Int
  provider          String    // "apple"
  providerAccountId String    // Apple user ID
  accessToken       String?
  refreshToken      String?
  idToken           String?   // JWT from Apple
  expiresAt         DateTime?
  tokenType         String?   // "Bearer"
  scope             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

## Useful Resources

- [Apple Developer Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Apple Sign In REST API](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api)
- [passport-apple Documentation](https://github.com/ananay/passport-apple)

## Summary

Apple Sign In is now fully configured! Users can:

- ✅ Sign in with Apple ID
- ✅ Choose to hide their email
- ✅ Share or withhold their name
- ✅ Use the same Apple ID across devices
- ✅ Link Apple account to existing email account

The integration works alongside Google OAuth and email/password authentication, giving users maximum flexibility.
