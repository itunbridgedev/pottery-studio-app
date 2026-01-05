import { Router } from "express";
import passport from "../config/passport";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/login?error=auth_failed`,
  }),
  (req, res) => {
    // Successful authentication, redirect to client
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/`);
  }
);

// Get current user
router.get("/me", isAuthenticated, (req, res) => {
  const user = req.user as any;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    roles: user.roles?.map((r: any) => r.role?.name) || [],
  });
});

// Logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Check auth status
router.get("/status", (req, res) => {
  res.json({ authenticated: req.isAuthenticated() });
});

export default router;
