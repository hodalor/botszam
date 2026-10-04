import { getSettings } from '../services/settings.service';
import { AppError } from '../utils/AppError';
import { formatKwacha } from '../utils/money';
import type {
  PaymentActor,
  PaymentInitContext,
  PaymentInstructions,
  PaymentOrderContext,
  PaymentProofInput,
  PaymentProvider,
  PaymentResult,
} from './PaymentProvider';

/**
 * The customer sends money to our MTN / Airtel / Zamtel numbers themselves, then submits
 * the transaction reference. An admin checks it against the mobile money statement.
 */
export class ManualMobileMoneyProvider implements PaymentProvider {
  readonly name = 'manual_mobile_money';
  readonly method = 'mobile_money' as const;

  async initiate(order: PaymentInitContext): Promise<PaymentResult> {
    return {
      status: 'awaiting_payment',
      payment: { provider: this.name },
      note: `Order placed. Awaiting mobile money payment of ${formatKwacha(order.totalNgwee)}`,
    };
  }

  async getInstructions(order: PaymentOrderContext): Promise<PaymentInstructions> {
    const settings = await getSettings();
    return {
      method: this.method,
      orderNumber: order.orderNumber,
      amountNgwee: order.totalNgwee,
      accounts: settings.mobileMoneyAccounts.map((a) => ({
        network: a.network,
        number: a.number,
        accountName: a.accountName,
      })),
      message:
        settings.paymentInstructions ||
        `Send exactly ${formatKwacha(order.totalNgwee)} to one of the numbers below, using ${order.orderNumber} as the reference, then submit your transaction ID.`,
    };
  }

  async submitProof(order: PaymentOrderContext, proof: PaymentProofInput): Promise<PaymentResult> {
    const resubmission = order.status === 'payment_rejected';
    if (order.status !== 'awaiting_payment' && !resubmission) {
      throw AppError.conflict(
        'Payment details can only be submitted while the order is awaiting payment',
        'INVALID_PAYMENT_STATE',
      );
    }
    return {
      status: 'payment_submitted',
      payment: {
        network: proof.network,
        payerPhone: proof.payerPhone,
        transactionRef: proof.transactionRef,
        submittedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
      },
      note: `Customer ${resubmission ? 'resubmitted' : 'submitted'} ${proof.network} payment, ref ${proof.transactionRef}`,
    };
  }

  async verify(order: PaymentOrderContext, actor: PaymentActor): Promise<PaymentResult> {
    if (order.status !== 'payment_submitted') {
      throw AppError.conflict('Only submitted payments can be verified', 'INVALID_PAYMENT_STATE');
    }
    return {
      status: 'paid',
      payment: { verifiedAt: new Date(), verifiedBy: actor.userId ?? undefined },
      note: 'Payment verified',
    };
  }

  async reject(order: PaymentOrderContext, actor: PaymentActor, reason: string): Promise<PaymentResult> {
    if (order.status !== 'payment_submitted') {
      throw AppError.conflict('Only submitted payments can be rejected', 'INVALID_PAYMENT_STATE');
    }
    return {
      status: 'payment_rejected',
      payment: { verifiedAt: new Date(), verifiedBy: actor.userId ?? undefined, rejectionReason: reason },
      note: `Payment rejected: ${reason}`,
    };
  }
}
