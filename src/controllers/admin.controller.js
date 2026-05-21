import { eq, count, desc } from 'drizzle-orm';
import db from '../db/index.js';
import { users, pdfUploads, aiResults } from '../db/schema.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'user'));
    const [pdfCount] = await db.select({ count: count() }).from(pdfUploads);
    const [resultCount] = await db.select({ count: count() }).from(aiResults);

    res.json({
      totalUsers: Number(userCount.count),
      totalPDFs: Number(pdfCount.count),
      totalAIResults: Number(resultCount.count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const userList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    // Get PDF count per user
    const pdfCounts = await db.select({
      userId: pdfUploads.userId,
      count: count(),
    }).from(pdfUploads).groupBy(pdfUploads.userId);

    const pdfMap = Object.fromEntries(pdfCounts.map(p => [p.userId, Number(p.count)]));

    const enriched = userList.map(u => ({
      ...u,
      pdfCount: pdfMap[u.id] || 0,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await db.delete(users).where(eq(users.id, userId));
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};
