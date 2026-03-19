'use client';

import GooglePayButton from '@google-pay/button-react';
import { useCart } from '@/hooks/use-cart';

interface GooglePayProps {
  onPaymentSuccess: (paymentData: google.payments.api.PaymentData) => void;
  onPaymentError: (error: any) => void;
}

export default function AuraGooglePayButton({ onPaymentSuccess, onPaymentError }: GooglePayProps) {
  const { totalPrice } = useCart();

  return (
    <div className="w-full">
      <GooglePayButton
        environment="TEST"
        buttonColor="black"
        buttonType="checkout"
        buttonSizeMode="fill"
        paymentRequest={{
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
              },
              tokenizationSpecification: {
                type: 'PAYMENT_GATEWAY',
                parameters: {
                  gateway: 'example',
                  gatewayMerchantId: 'exampleGatewayMerchantId',
                },
              },
            },
          ],
          merchantInfo: {
            merchantId: '12345678901234567890',
            merchantName: 'Aura Flutes',
          },
          transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPriceLabel: 'Total',
            totalPrice: totalPrice.toString(),
            currencyCode: 'USD',
            countryCode: 'US',
          },
        }}
        onLoadPaymentData={(paymentData) => {
          console.log('Payment data loaded', paymentData);
          onPaymentSuccess(paymentData);
        }}
        onError={(error) => {
          console.error('Payment error', error);
          onPaymentError(error);
        }}
        className="w-full"
      />
    </div>
  );
}
