import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../db/index.js';
import { users } from '../db/schema.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation check
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Database madhun user la shodha (Drizzle ORM syntax)
    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userList[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Password verify kara
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. JWT Token generate kara
    // Make sure process.env.JWT_SECRET tumchya Render Environment settings madhe added asel!
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '7d' }
    );

    // 5. Secure Cross-Domain Production Cookie Settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,      // Render sathi secure (HTTPS) compulsory aahe
      sameSite: 'none',  // Vercel frontend la pass honyasathi he garjeche aahe
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 divas
    });

    // 6. Response pathva (AuthContext user state la match honyasathi structure: { user })
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    // Ha log Render dashboard var exact error dakhavel jar kai crash jhale tar!
    console.error("❌ CRASH ERROR IN LOGIN CONTROLLER:", error);
    return res.status(500).json({ message: "Internal server error inside login engine" });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
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
