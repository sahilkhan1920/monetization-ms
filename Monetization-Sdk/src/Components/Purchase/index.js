import React, { useState, useEffect } from 'react'
import pubsub from "@viewlift/pubsub"
// import { getPaymentHandler, getQueryVariable } from '../../Helpers/helpers'
import { updateMonetizationStore } from '../../updateStore'
import Stripe from '../Stripe/Stripe'
import "./style.scss"

const Purchase = ({ moduleData, purchase, metadataMap, upgradePlanId, country = "IN" }) => {
    const [currentPlan, setCurrentPlan] = useState(null)
    const [firstPayment, setFirstPayment] = useState({})
    const getCurrentPlan = (data) => {
        setCurrentPlan(data)
    }
    const getMonetizationStore = (data) => {
        setCurrentPlan(data.currentSelectedPlan)
    }
    const handleFirstPayment = (data) => {
        let date = new Date(data?.nextBillingDate);
        date = date.toLocaleString('en-US')
        setFirstPayment({ data, date })
    }
    useEffect(() => {
        updateMonetizationStore()
        pubsub.subscribe('monetizationStore', getMonetizationStore)
        pubsub.subscribe('currentPlan', getCurrentPlan)
        pubsub.subscribe('firstPayment', handleFirstPayment)
    }, [])
    return (<>
        <div className='payment-container site-color'>
            {/* {paymentProvider == 'stripe' &&  */}
            <Stripe moduleData={moduleData} firstPayment={firstPayment} metadataMap={metadataMap} />
            {/* } */}
            {country !== "NL" && <div className="legal-texts">{metadataMap?.billingAgreement}</div>}
        </div>
    </>
    )
}

export default Purchase