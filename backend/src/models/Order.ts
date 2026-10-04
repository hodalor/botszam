import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ngweeValidator } from '../utils/money';
import { NORMALISED_PHONE_REGEX } from '../utils/phone';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../utils/orderStatus';
import { MOBILE_MONEY_NETWORKS } from './Settings';

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    colour: { type: String, required: true },
    image: { type: String, default: null },
    unitPriceNgwee: { type: Number, required: true, validate: ngweeValidator },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Quantity must be an integer' },
    },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    provider: { type: String, required: true },
    network: { type: String, enum: MOBILE_MONEY_NETWORKS },
    payerPhone: { type: String, match: NORMALISED_PHONE_REGEX },
    transactionRef: { type: String, trim: true, maxlength: 100 },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, required: true, default: () => new Date() },
    by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: false },
);

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, match: NORMALISED_PHONE_REGEX },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

const deliveryAddressSchema = new Schema(
  {
    zone: { type: Schema.Types.ObjectId, ref: 'DeliveryZone', required: true },
    // Snapshot so the order still reads correctly if the zone is renamed or removed.
    zoneName: { type: String, required: true },
    area: { type: String, required: true, trim: true, maxlength: 120 },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, default: '', maxlength: 200 },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customer: { type: customerSchema, required: true },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: 'An order needs at least one item',
      },
    },
    subtotalNgwee: { type: Number, required: true, validate: ngweeValidator },
    deliveryFeeNgwee: { type: Number, required: true, validate: ngweeValidator },
    totalNgwee: { type: Number, required: true, validate: ngweeValidator },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    payment: { type: paymentSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, required: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'deliveryAddress.zone': 1 });
// A mobile money transaction can only ever be claimed by one order.
orderSchema.index(
  { 'payment.network': 1, 'payment.transactionRef': 1 },
  { unique: true, partialFilterExpression: { 'payment.transactionRef': { $type: 'string' } } },
);

export type Order = InferSchemaType<typeof orderSchema>;
export type OrderDocument = HydratedDocument<Order>;
export const OrderModel = model('Order', orderSchema);
