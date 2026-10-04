import type { RequestHandler } from 'express';
import { OrderModel } from '../../models/Order';
import { ProductModel } from '../../models/Product';
import { ORDER_STATUSES, REVENUE_FILTER } from '../../utils/orderStatus';
import { startOfLusakaDay, startOfLusakaMonth } from '../../utils/time';

interface RevenueBucket {
  totalNgwee: number;
  orders: number;
}

export const stats: RequestHandler = async (_req, res) => {
  const todayStart = startOfLusakaDay();
  const monthStart = startOfLusakaMonth();
  const revenueGroup = [{ $group: { _id: null, totalNgwee: { $sum: '$totalNgwee' }, orders: { $sum: 1 } } }];

  const [orderFacets] = await OrderModel.aggregate<{
    today: RevenueBucket[];
    month: RevenueBucket[];
    byStatus: { _id: string; count: number }[];
  }>([
    {
      $facet: {
        today: [{ $match: { ...REVENUE_FILTER, createdAt: { $gte: todayStart } } }, ...revenueGroup],
        month: [{ $match: { ...REVENUE_FILTER, createdAt: { $gte: monthStart } } }, ...revenueGroup],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      },
    },
  ]);

  const [lowStock] = await ProductModel.aggregate<{ count: number }>([
    { $match: { active: true } },
    { $unwind: '$variants' },
    {
      $match: {
        'variants.active': { $ne: false },
        $expr: { $lte: ['$variants.stock', '$variants.lowStockThreshold'] },
      },
    },
    { $count: 'count' },
  ]);

  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  for (const row of orderFacets.byStatus) ordersByStatus[row._id] = row.count;

  const bucket = (b: RevenueBucket[]) => ({ totalNgwee: b[0]?.totalNgwee ?? 0, orders: b[0]?.orders ?? 0 });

  res.json({
    revenue: { today: bucket(orderFacets.today), month: bucket(orderFacets.month) },
    ordersByStatus,
    pendingPaymentVerifications: ordersByStatus.payment_submitted,
    lowStockVariants: lowStock?.count ?? 0,
  });
};
