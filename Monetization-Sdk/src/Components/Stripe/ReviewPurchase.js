import React from 'react'
import StripeButtons from './StripeButtons'
import getSymbolFromCurrency from 'currency-symbol-map'

const ReviewPurchase = ({fields,currentPlan,firstPayment}) => {
  return (<>
    <h4 className='site-color'>{fields?.reviewPurchaseTxt || 'Review Purchase'}</h4>
    {currentPlan && firstPayment &&<div className='review-container'>
    <div className='review-detail'>
      <h5>{fields?.paymentMethodTxt || "Payment Method"}</h5>
      <h5>Card</h5>
    </div>
    <div className='review-detail'>
      <h5>{fields?.plantypeTxt || 'Plan'}</h5>
      <h5>{currentPlan?.renewalCycleType ? currentPlan?.renewalCycleType + 'LY' : 'not identified'}</h5>
    </div>
    <div className='review-detail'>
      <h5>{fields?.purchaseTypeTxt || "Purchase Type"}</h5>
      <h5>Recurring</h5>
    </div>
    <div className='review-detail'>
      <h5>{fields?.chargeTxt || 'Charge'}</h5>
      <h5>{getSymbolFromCurrency(currentPlan?.planDetails[0]?.recurringPaymentCurrencyCode) + ' ' + firstPayment?.data?.amount}</h5>
    </div>
    </div>}
    <StripeButtons metadataMap={fields} />
  </>)
}

export default ReviewPurchase