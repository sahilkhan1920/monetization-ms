import React, { useEffect, useState } from 'react'
import {crossIcon, paymentFailureIcon, paymentSuccessIcon} from "./statusIcons"
import "./style.scss"
// import { subscriptionStore } from '../../Api'

const StatusPopup = ({statusData, handleRetry, handlePaymentSuccess, metadataMap}) => {
  let {success, data} = statusData
  const handleCancel = () => {
    let {handleRoute, navigateRef} = data 
    let nextRoute = handleRoute()
    nextRoute.then((res:any) => {
        navigateRef.current(res);
    })
  }
  return (<>
    <div className='status-wrapper'>
      <div className='status-container site-background-color'>
        {success ? <div className='cross-icon' onClick={() => handlePaymentSuccess()}>{crossIcon()}</div> : <></>}
        <div className='status-icon'>{success ? paymentSuccessIcon() : paymentFailureIcon()}</div>
        <div className='payment-status-title'>{success ? metadataMap?.paymentReceivedText || 'Payment Received' : metadataMap?.paymentFailedText || 'Payment Failed'}</div>
        <div className='payment-status-description'>{success ? metadataMap?.paymentReceivedDescription || 'We’ve received your payment. You will be redirected in a moment.' : metadataMap?.paymentFailedDescription || 'You have insufficient fund.'}</div>
          {!success ? <div className='fail-btns'>
            <div className='fail-btn site-cta-background-color' onClick={handleRetry}>{metadataMap?.retryPaymentBtnCta || 'Retry Payment'}</div>
            <div className='cancel-btn' onClick={handleCancel}>{metadataMap?.cancelBtnCta || 'cancel'}</div>
          </div>: <></>}
      </div>
    </div>
  </>)
}

export default StatusPopup