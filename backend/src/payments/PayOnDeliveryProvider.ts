import { AppError } from '../utils/AppError';
import { formatKwacha } from '../utils/money';
import type {
  PaymentInitContext,
  PaymentInstructions,
  PaymentOrderContext,
  PaymentProvider,
  PaymentResult,
} from './PaymentProvider';

/** Cash or mobile money collected by the driver. Payment is settled when the order is delivered. */
export class PayOnDeliveryProvider implements PaymentProvider {
  readonly name = 'pay_on_delivery';
  readonly method = 'pay_on_delivery' as const;

  async initiate(): Promise<PaymentResult> {
    return {
      status: 'pending_confirmation',
      payment: { provider: this.name },
      note: 'Order placed. Pay on delivery',
    };
  }

  async getInstructions(order: PaymentOrderContext | PaymentInitContext): Promise<PaymentInstructions> {
    return {
      method: this.method,
      orderNumber: order.orderNumber,
      amountNgwee: order.totalNgwee,
      accounts: [],
      message: `We will call to confirm your order. Please have ${formatKwacha(order.totalNgwee)} ready in cash or mobile money when it is delivered.`,
    };
  }

  async submitProof(): Promise<PaymentResult> {
    throw this.unsupported();
  }

  async verify(): Promise<PaymentResult> {
    throw this.unsupported();
  }

  async reject(): Promise<PaymentResult> {
    throw this.unsupported();
  }

  private unsupported() {
    return AppError.badRequest(
      'Pay on delivery orders are settled when delivered',
      'PAYMENT_ACTION_NOT_SUPPORTED',
    );
  }
}
