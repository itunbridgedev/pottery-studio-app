import { PrismaClient } from "@prisma/client";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:4000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const picture = profile.photos?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        // Find or create customer
        let customer = await prisma.customer.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (!customer) {
          // Create new customer
          customer = await prisma.customer.create({
            data: {
              email,
              name,
              picture,
              accounts: {
                create: {
                  provider: "google",
                  providerAccountId: googleId,
                  accessToken,
                  refreshToken,
                  expiresAt: profile._json.exp
                    ? new Date(profile._json.exp * 1000)
                    : null,
                  tokenType: "Bearer",
                  scope: null,
                  idToken: null,
                },
              },
            },
            include: { accounts: true },
          });
        } else {
          // Update or create account for existing customer
          const existingAccount = customer.accounts.find(
            (acc) =>
              acc.provider === "google" && acc.providerAccountId === googleId
          );

          if (existingAccount) {
            // Update existing account
            await prisma.account.update({
              where: { id: existingAccount.id },
              data: {
                accessToken,
                refreshToken,
                expiresAt: profile._json.exp
                  ? new Date(profile._json.exp * 1000)
                  : null,
                scope: null,
                idToken: null,
              },
            });
          } else {
            // Create new account for existing customer
            await prisma.account.create({
              data: {
                customerId: customer.id,
                provider: "google",
                providerAccountId: googleId,
                accessToken,
                refreshToken,
                expiresAt: profile._json.exp
                  ? new Date(profile._json.exp * 1000)
                  : null,
                tokenType: "Bearer",
                scope: null,
                idToken: null,
              },
            });
          }

          // Update customer info
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              name,
              picture,
            },
            include: { accounts: true },
          });
        }

        return done(null, customer);
      } catch (error) {
        console.error("Error in Google OAuth strategy:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { accounts: true, roles: true },
    });
    done(null, customer);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
