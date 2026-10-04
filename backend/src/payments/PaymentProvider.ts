import type { Types } from 'mongoose';
import type { MobileMoneyNetwork } from '../models/Settings';
import type { OrderStatus, PaymentMethod } from '../utils/orderStatus';

/** Fields of Order.payment that a provider is allowed to set. */
export interface PaymentDetails {
  provider: string;
  network?: MobileMoneyNetwork;
  payerPhone?: string;
  transactionRef?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  rejectionReason?: string;
}

/**
 * The view of an order a provider gets. Providers never touch stock, prices or totals;
 * they only decide the next payment status and payment fields.
 */
export interface PaymentOrderContext {
  orderNumber: string;
  totalNgwee: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  payment: Partial<PaymentDetails>;
}

export type PaymentInitContext = Pick<PaymentOrderContext, 'orderNumber' | 'totalNgwee' | 'paymentMethod'>;

export interface PaymentInstructions {
  method: PaymentMethod;
  orderNumber: string;
  amountNgwee: number;
  accounts: { network: MobileMoneyNetwork; number: string; accountName: string }[];
  message: string;
}

export interface PaymentProofInput {
  network: MobileMoneyNetwork;
  payerPhone: string;
  transactionRef: string;
}

/** Who triggered a payment action: an admin, or null for the customer / a provider callback. */
export interface PaymentActor {
  userId: Types.ObjectId | null;
}

/** What the order service should apply after a provider action. */
export interface PaymentResult {
  status: OrderStatus;
  /** Fields to set on order.payment; `null` clears a field. */
  payment: { [K in keyof PaymentDetails]?: PaymentDetails[K] | null };
  note: string;
}

export interface PaymentProvider {
  /** Stored on the order as payment.provider so later actions reach the same provider. */
  readonly name: string;
  readonly method: PaymentMethod;

  /** Called inside the order-creation transaction. Must not perform slow external calls. */
  initiate(order: PaymentInitContext): Promise<PaymentResult>;

  /** How the customer should pay (shown after checkout and on the tracking page). */
  getInstructions(order: PaymentOrderContext): Promise<PaymentInstructions>;

  /** Customer reports a payment (manual) or a provider callback arrives (API providers). */
  submitProof(order: PaymentOrderContext, proof: PaymentProofInput): Promise<PaymentResult>;

  verify(order: PaymentOrderContext, actor: PaymentActor): Promise<PaymentResult>;

  reject(order: PaymentOrderContext, actor: PaymentActor, reason: string): Promise<PaymentResult>;
}
