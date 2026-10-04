import type { RequestHandler } from 'express';
import { validated } from '../../middleware/validate';
import { OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { normalisePhone } from '../../utils/phone';
import { escapeRegex, paginationMeta } from '../../utils/validation';
import { adminCustomerListQuery } from '../../validators/admin.validators';

export const list: RequestHandler = async (req, res) => {
  const q = validated(adminCustomerListQuery, req.query);
  const filter: Record<string, unknown> = { role: 'customer' };

  if (q.search) {
    const or: Record<string, unknown>[] = [
      { name: { $regex: escapeRegex(q.search), $options: 'i' } },
      { email: { $regex: escapeRegex(q.search), $options: 'i' } },
    ];
    const phone = normalisePhone(q.search);
    if (phone) or.push({ phone });
    const digits = q.search.replace(/\D/g, '');
    if (digits.length >= 4) {
      or.push({ phone: { $regex: escapeRegex(digits.replace(/^0/, '')) } });
    }
    filter.$or = or;
  }

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .select('name email phone addresses createdAt updatedAt')
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  const phones = users.map((u) => u.phone);
  const orderCounts =
    phones.length === 0
      ? []
      : await OrderModel.aggregate<{ _id: string; orders: number; lastOrderAt: Date }>([
          { $match: { 'customer.phone': { $in: phones } } },
          {
            $group: {
              _id: '$customer.phone',
              orders: { $sum: 1 },
              lastOrderAt: { $max: '$createdAt' },
            },
          },
        ]);

  const byPhone = new Map(orderCounts.map((row) => [row._id, row]));

  res.json({
    items: users.map((user) => {
      const stats = byPhone.get(user.phone);
      return {
        _id: user._id,
        name: user.name,
        email: user.email ?? '',
        phone: user.phone,
        addressCount: user.addresses?.length ?? 0,
        orderCount: stats?.orders ?? 0,
        lastOrderAt: stats?.lastOrderAt?.toISOString() ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }),
    pagination: paginationMeta(q.page, q.limit, total),
  });
};
