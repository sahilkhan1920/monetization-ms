import React, { useEffect, useState, useRef } from 'react'
import StripeCCForm from './StripeCCForm'
import { StripeScript } from './StripeScript'
import pubsub from "@viewlift/pubsub"
import { getBillingToken, handleSubscriptionAnalytics, purchaseEvent, subscribe } from './helpers'
import "./style.scss"
import { fetchUserObject } from '../../fetchStore'
import localforage from 'localforage'
import { useNavigate } from 'react-router-dom'
import {ANALYTICS, FB_EVENTS, pixel_Events} from '../../../../../../client/helpers/analyticsMap';

const Stripe = ({ moduleData, offerCode, firstPayment, metadataMap }) => {
  const navigateRef = useRef(useNavigate());
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [formRef, setFormRef] = useState(false)
  const [currentPlan, setCurrentPlan] = useState({})
  const [subscribeStatus, setSuscribeStatus] = useState(false)
  const [isError,setIsError] = useState(false)
  let subscribeInfo = {}
  const loadStripe = async () => {
    await StripeScript()
    setStripeLoaded(true)
  }
  const getMonetizationStore = (data) => {
    setCurrentPlan(data.currentSelectedPlan)
  }
  const success = (status,plan) => {
    let planDetails = plan?.planDetails.length && plan.planDetails[0]
      let payload = {
          paymentPlan: plan?.name,
          country: planDetails?.countryCode,
          value: planDetails?.recurringPaymentAmount,
          currency : planDetails?.recurringPaymentCurrencyCode
      }
    if(status === 'InProcess'){
      pubsub.subscribe('user-analytics',{ename:ANALYTICS.PAYMENT_PENDING,data:plan});
    }else if(status === 'Success'){
      pubsub.subscribe('user-analytics',{ename:ANALYTICS.PAYMENT_SUCCCESS,data:plan});
      handleSubscriptionAnalytics("FB",FB_EVENTS.SUBSCRIPTION_COMPLETED,payload)
      handleSubscriptionAnalytics("PIXEL",pixel_Events.SUBSCRIPTION_COMPLETED,{
        value: payload.value,
        currency: payload.currency
      })
    }else if(status === 'Failed'){
      pubsub.subscribe('user-analytics',{ename:ANALYTICS.PAYMENT_FAILURE,data:plan});
      handleSubscriptionAnalytics("FB",FB_EVENTS.SUBSCRIPTION_FAILED,payload)
      setIsError(true)
    }
    setSuscribeStatus(status)
    pubsub.publish('isLoading', false)
    pubsub.publish('processing', false)
  }
  const getFormRef = (data) => {
    setFormRef(data)
  }
  const handleError = (data) => {
    setIsError(data)
  }
  useEffect(() => {
    loadStripe()
    pubsub.subscribe("purchaseError", handleError)
    pubsub.subscribe("formRef", getFormRef)
    pubsub.subscribe('monetizationStore', getMonetizationStore)

  }, [])

  const onToken = async (token, stripeObj, cardElement) => {
    const user = await fetchUserObject()
    return getBillingToken(token, stripeObj, cardElement)
      .then(async (billingToken) => {
        let userObj = user;
        userObj.billingInfo = billingToken;
        subscribeInfo = {
          plan: currentPlan,
          billingToken: billingToken,
          offerCode: offerCode && offerCode.code || null,
          onOpen: () => success("InProcess"),
          onMessageSuccess: () => success("Success",subscribeInfo?.currentPlan),
          onMessageFailure: () => success("Failed"),
          onError: () => success("InProcess"),
        }
        purchaseEvent(currentPlan, offerCode, token)
        subscribe(subscribeInfo,navigateRef)
      }).catch((e) => {
        pubsub.publish("purchaseError", true)
        pubsub.publish('processing', false)
        pubsub.publish('isLoading', false)
      })
  }
  const onStripeSubmit = async(e) => {
    e.preventDefault()
    let monetizationStore=await localforage.getItem("MonetizationStore");
    pubsub.publish('user-analytics',{ename:ANALYTICS.PAYMENT_INITIATE,data:monetizationStore?.currentSelectedPlan});
    let planDetails = monetizationStore?.currentSelectedPlan?.planDetails.length && monetizationStore.currentSelectedPlan.planDetails[0]
    const user = await fetchUserObject()
    let payload = {
      paymentHandler: 'stripe',
      country: planDetails?.countryCode,
      currency: planDetails.recurringPaymentCurrencyCode,
      paymentPlan: monetizationStore?.currentSelectedPlan?.name,
      discountAmount: planDetails?.recurringPaymentAmount, //needs to be changed
      discountedAmount: planDetails?.recurringPaymentAmount,
      transactionAmount: planDetails?.recurringPaymentAmount,
      platform: 'Web',
      userId: user?.userId,
      planId: monetizationStore?.currentSelectedPlan?.id,
      networkType : window.navigator.connection ? (window.navigator.connection.type ? window.navigator.connection.type : window.navigator.connection.effectiveType) : "wifi" 
    }
    handleSubscriptionAnalytics("FB",FB_EVENTS.SUBSCRIPTION_INITIATED,payload)
    handleSubscriptionAnalytics("PIXEL",pixel_Events.SUBSCRIPTION_INITIATED,payload)
    pubsub.publish('isLoading', true)
    pubsub.publish('processing', true)
    if (formRef) {
      let { stripe, cardElement } = formRef;
      stripe
        .createToken(cardElement)
        .then(async p =>{
          if (p?.error?.message) {
            pubsub.publish("purchaseError", p.error.message)
            pubsub.publish('processing', false)
            pubsub.publish('isLoading', false)
            return
          }
          onToken(p, stripe, cardElement)
        })
        .catch(e => {
          pubsub.publish('processing', false)
          pubsub.publish('isLoading', false)
          pubsub.publish("purchaseError", true)
          console.log(e)
        })
    }
  }
  return (<>
    {isError && <div className='error-msg'><p>{isError && typeof isError === "string" ? isError : 'Not able to complete the request'}</p></div>}
    <form
      onSubmit={e => onStripeSubmit(e)}>
      {stripeLoaded && <StripeCCForm moduleData={moduleData} currentPlan={currentPlan} firstPayment={firstPayment} metadataMap={metadataMap} />}
    </form>
  </>
  )
}

export default Stripe