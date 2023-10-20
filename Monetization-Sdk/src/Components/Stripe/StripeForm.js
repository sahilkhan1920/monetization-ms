import React, { useEffect, useState } from 'react'
import pubsub from "@viewlift/pubsub"
// import AddressForm from './AddressForm'
import CcForm from './CcForm'
import ReviewPurchase from './ReviewPurchase'

const StripeForm = (props) => {

   const[metadataMap,setMetadataMap] = useState(props?.metadataMap)
   const[progressState,setProgressState] = useState(1)
   
   const handleMetadata = (data) => {
    setMetadataMap(data)
   }
   
   const handleProgressState = (data) => {
    setProgressState(data)
   }
   useEffect(()=>{
    pubsub.subscribe("metadataMap",handleMetadata)
    pubsub.subscribe('progressState',handleProgressState)

   },[])
    return (<>
      {props.currentPlan && props.currentPlan.planDetails && props.currentPlan.planDetails[0] && <div className="cc-form stripe-form">
                <div className={progressState == 2 ? 'hide' : ''}><CcForm moduleData={props?.moduleData} fields={metadataMap} /></div>
                <div className={progressState == 1 ? 'hide' : ''}>
                <ReviewPurchase currentPlan={props.currentPlan} fields={metadataMap} firstPayment={props.firstPayment} /></div>
        </div>}
    </>
    )
}

export default StripeForm