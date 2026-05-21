import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../db/index.js';
import { users } from '../db/schema.js';

// ✅ FIXED FOR PRODUCTION (Cross-domain Vercel + Render support)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // true for HTTPS production environment
  sameSite: 'none', // Critical to allow cookie passing between Vercel and Render
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    // ✅ Return both user and token
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userList[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '7d' }
    );

    // Set secure cross-domain production cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    // ✅ FIXED: Explicitly sending token in JSON so LocalStorage fallback can read it!
    return res.status(200).json({
      message: "Login successful",
      token: token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ CRASH ERROR IN LOGIN CONTROLLER:", error);
    return res.status(500).json({ message: "Internal server error inside login engine" });
  }
};

export const logout = (req, res) => {
  // ✅ Explicit clear options using same security flags
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt
    }).from(users).where(eq(users.id, req.user.id));

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
