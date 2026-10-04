import { AppError } from '../utils/AppError';
import type { PaymentMethod } from '../utils/orderStatus';
import { ManualMobileMoneyProvider } from './ManualMobileMoneyProvider';
import { PayOnDeliveryProvider } from './PayOnDeliveryProvider';
import type { PaymentProvider } from './PaymentProvider';

export * from './PaymentProvider';

const providers = new Map<string, PaymentProvider>();

function register(provider: PaymentProvider) {
  providers.set(provider.name, provider);
}

register(new ManualMobileMoneyProvider());
register(new PayOnDeliveryProvider());

/**
 * Which provider handles new orders for each payment method. To switch to an API provider,
 * register its class above and point the method at its name here. Existing orders keep using
 * the provider recorded on them.
 */
const PROVIDER_FOR_METHOD: Record<PaymentMethod, string> = {
  mobile_money: 'manual_mobile_money',
  pay_on_delivery: 'pay_on_delivery',
};

export function getProviderForMethod(method: PaymentMethod): PaymentProvider {
  return getProviderByName(PROVIDER_FOR_METHOD[method]);
}

export function getProviderByName(name: string): PaymentProvider {
  const provider = providers.get(name);
  if (!provider) {
    throw new AppError(`Unknown payment provider "${name}"`, 500, 'PAYMENT_PROVIDER_MISSING');
  }
  return provider;
}
