import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Config } from "../config";
import { HttpError } from "../errors";
import { requireAuth, currentUserId } from "../middleware/auth";
import { User, toPublic } from "../models/User";
import { avatarSchema, loginSchema, registerSchema } from "../schemas";
import { signToken } from "../services/tokens";

export function authRouter(config: Config): Router {
  const router = Router();
  const auth = requireAuth(config);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.authRateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, msg: "Too many attempts, try again later" },
  });

  router.post("/register", limiter, async (req, res) => {
    const { username, email, password } = registerSchema.parse(req.body);
    const taken = await User.findOne({ $or: [{ username }, { email }] });
    if (taken) {
      throw new HttpError(409, taken.username === username ? "Username already used" : "Email already used");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    res.status(201).json({ status: true, user: toPublic(user), token: signToken(config, user._id.toString()) });
  });

  router.post("/login", limiter, async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ username });
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !ok) throw new HttpError(401, "Incorrect username or password");
    res.json({ status: true, user: toPublic(user), token: signToken(config, user._id.toString()) });
  });

  router.get("/me", auth, async (req, res) => {
    const user = await User.findById(currentUserId(req));
    if (!user) throw new HttpError(401, "Account no longer exists");
    res.json({ status: true, user: toPublic(user) });
  });

  router.post("/setAvatar", auth, async (req, res) => {
    const { image } = avatarSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      currentUserId(req),
      { isAvatarImageSet: true, avatarImage: image },
      { new: true }
    );
    if (!user) throw new HttpError(401, "Account no longer exists");
    res.json({ status: true, isSet: true, image: user.avatarImage });
  });

  router.get("/allusers", auth, async (req, res) => {
    const users = await User.find({ _id: { $ne: currentUserId(req) } }).sort({ username: 1 });
    res.json(users.map(toPublic));
  });

  return router;
}
