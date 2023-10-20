import React, { useEffect, useState } from 'react'
import { MonetizationStore } from '../../MonetizationStore'
import { getPriceFormat } from '../../Helpers/helpers'
import { updateMonetizationStore } from '../../updateStore'
import pubsub from "@viewlift/pubsub"

const StripeButtons = ({ metadataMap, moduleSettings }) => {
  const [currentPlan, setCurrentPlan] = useState(null)
  const [firstPayment, setFirstPayment] = useState(null)
  const [legalVerbiage, setLegalVerbiage] = useState(null)
  const [isLoaded,setIsLoaded] = useState(false)
  const [alert, setAlert] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const getMonetizationStore = (data) => {
    setCurrentPlan(data.currentSelectedPlan)
    setFirstPayment(data.firstPayment)
  }
  const getDiscountedData = (data) => {
    setFirstPayment(data)
  }
  const isLoadedFunc = (data) => {
    if (data) setIsLoaded(false)
    else setIsLoaded(true)
  }
  useEffect(() => {
    pubsub.subscribe('isLoading',isLoadedFunc)
    pubsub.subscribe('firstPayment', getDiscountedData)
    pubsub.subscribe('monetizationStore', getMonetizationStore)
    updateMonetizationStore()
  }, [])

  const getIsProcessing = (data) => {
    setIsProcessing(data)
  }

  useEffect(() => {
    pubsub.subscribe('processing',getIsProcessing)
    if (firstPayment && currentPlan && isLoaded) {
      let date = new Date(firstPayment.nextBillingDate);
      let verbiage = metadataMap.billingAcceptVerbiage
      date = date.toLocaleString('en-US')
      let expiration = date || ''
      let priceFormat = getPriceFormat(currentPlan.planDetails[0], currentPlan)
      verbiage = verbiage && verbiage.replace(/\[deadline\]/g, expiration)
      verbiage = verbiage && verbiage.replace(/\[price\]/g, priceFormat)
      setLegalVerbiage(verbiage)
    }
  }, [currentPlan])
  return (<>
        {moduleSettings && moduleSettings.legalVerbiageCheck && <div className="flex">
             <div className="billing-verbiage-check">
              <input 
                name="billing-legal-check"
                type="checkbox" 
                id="billing-legal-check"            
              />  
            </div>
          <div className="legal-texts" />{legalVerbiage}
        </div>}
        { alert && <div className="alert">{ alert }</div> }
        <input
          className={
            'button continue-button site-cta-background-color site-cta-color ' 
          }
          type="submit"
          value={!isProcessing ?metadataMap?.confirmTxt || 'Confirm Purchase' : metadataMap?.processingTxt ||  'Processing'} 
        />
  </>)
}
export default StripeButtons