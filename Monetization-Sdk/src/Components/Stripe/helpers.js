import axios from 'axios'
import { fetchUserObject, fetchUserDetails } from '../../fetchStore'
import {getToken} from "../../../../web-authentication-sdk/src/helper" 
import trackEvent from "../../../../../helpers/trackAnalytics"
import localforage from 'localforage'
import { dynamicConfig } from '../../../../../components/DynamicRoutes'
import { subscriptionStore } from '../../Api'
import pubsub from "@viewlift/pubsub"
import {FB_EVENTS} from '../../../../../../client/helpers/analyticsMap';
let xApikey = window?.xApiKey
let apiBaseUrl = window?.apiBaseUrl
let site =  window?.app_data?.site?.siteInternalName

const handleRoute = async (justSubscribed) => {
  let routeState = await localforage.getItem("routeState")
  let isSkipped = false
  let nextRoute = await dynamicConfig(routeState,location?.pathname,isSkipped,justSubscribed)
  return nextRoute
}

export const handleSubscriptionAnalytics = (type,eventType, payload) => {
  pubsub.publish("FB-analytics",{eventType,payload,type})
}

export const getBillingToken = async (stripeToken, stripeRef,cardElement) => {
    let user = await fetchUserObject() //user
    let token = await getToken(token => {return token})
    let intentObj = await setupIntent();
    var confirmIntentObj = await stripeRef.handleCardSetup(intentObj.data && intentObj.data.client_secret,cardElement,{
      payment_method_data: {
        billing_details: {
          "address": {
            "country": stripeToken.token.card.country,
            "city": stripeToken.token.card.address_city,
            "line1": stripeToken.token.card.address_line1,
            "state": stripeToken.token.card.address_state,
            "postal_code": stripeToken.token.card.address_zip
          },
          "name": stripeToken.token.card.name
        }
      }
    })
    if(confirmIntentObj.error) {
      throw new Error(confirmIntentObj.error.message)
    }
    try {
      var r = await validate_stripe_customer(token, confirmIntentObj, stripeToken, user);
      var status = r.data.cardStatus;
      if (status.cvc_check !== 'pass' && status.cvc_check !== 'unavailable' && status.cvc_check !== 'unchecked')
        throw new Error({
          'message': 'Your CVC is invalid'
        })
    }
    catch (err) {
      throw new Error(err.message)
    }
    return {
      stripeToken: stripeToken,
      requestId: r.data.requestId
    }
  }

async function setupIntent() {
  let token = await getToken(token => {return token})
    return axios({
    method: 'POST',
    url: `${apiBaseUrl}/payments/stripe/setup_intent`,
    data: {},
    headers: {
      'Authorization': token,
      'x-api-key': xApikey
    },
    params: {
      site: site
    }
})
}

function validate_stripe_customer(token, confirmIntentObj, stripeToken, user) {
  return axios({
    url: `/payments/stripe/validate_stripe_customer`,
    baseURL: apiBaseUrl,
    method: 'POST',
    params: { site: site, platform: 'web_browser' },
    headers: { 
      'Authorization': token,
      'x-api-key': xApikey
    },
    data: { 
      token: stripeToken.token.id, 
      email: user && user.email, 
      paymentMethodId: confirmIntentObj.setupIntent && confirmIntentObj.setupIntent.payment_method 
    }
  })
}

export const subscribeNotificationWs = (subscribeObj = {},navigateRef) => {
  getToken(token => {
    const { onOpen, onMessageSuccess, onMessageFailure, onError } = subscribeObj;
    // const webSocketBaseUrl = window?.apiBaseUrl.replace('api','ws').replace('https','wss');
    var paymentSocket = new WebSocket(`${window?.wssBaseUrl}?token=${token}`)
    var isPaymentinProcess = false;
    var subscribeMessage =  {
      "action": "subscribe",
      "eventType": "SUBSCRIPTION",
      "token" : token
    }

    paymentSocket.onopen = function() {
      console.log('socket opened')
      paymentSocket.send(JSON.stringify(subscribeMessage));
      setTimeout(()=>{
        if(!isPaymentinProcess){
          paymentSocket.close();
          typeof onOpen === 'function' && onOpen();
          isPaymentinProcess = true;
        }
      },60000);
    }
    paymentSocket.onmessage = function (event) {
      console.log("socket message received");
      isPaymentinProcess = true;
      var paymentData = event.data && JSON.parse(event.data)
      if(paymentData.event === "subscription" && paymentData.status === "completed") {
        typeof onMessageSuccess === 'function' && onMessageSuccess();
        pubsub.publish('payment-status',{success : paymentData.status === "completed" ? true : false, data : {handleRoute,navigateRef}})
        isPaymentinProcess = false;
      } else {
        isPaymentinProcess = false;
      }
      paymentSocket.close();
    }
    paymentSocket.onerror = function () {
      console.log("connection error");
      typeof onMessageFailure === 'function' && onMessageFailure()
      pubsub.publish('payment-status',{success : false, data : {handleRoute,navigateRef}})
      isPaymentinProcess = true;
      paymentSocket.close();
    }
  })
}


export const subscribe = async (o,navigateRef) => {
  let token = await getToken(token => {return token})
  let { userId } = await fetchUserDetails()
  let subscription = null
    let userCurrentPayment = null, currentStatus = null
    if(subscription) {
      subscription = JSON.parse(subscription)
      userCurrentPayment = subscription && subscription.subscription && subscription.subscription.subscriptionInfo.paymentHandler
      currentStatus = subscription && subscription.subscription && subscription.subscription.subscriptionStatus
    }
    let method = (userCurrentPayment === "PREPAID" && currentStatus === "COMPLETED") ? "PUT" : "POST"
    const amazonPay = o.paymentUniqueId && o.paymentUniqueId
    // const paypal = o.vlTransactionId
    const stripe = o.billingToken && o.billingToken
    const data = {
      subscription: o.subscription || 'stripe',
      siteId: window?.app_data?.appcmsMain?.siteId,
      platform: 'web_browser',
      planId: o.plan.id,
      planIdentifier: o.plan.identifier,
      userId: userId,
      currencyCode: o.plan.planDetails[0].recurringPaymentCurrencyCode,
      appliedOffers: o.offerCode ? [ o.offerCode ] : undefined,
      ...(amazonPay && { paymentUniqueId: o.paymentUniqueId }),
      ...(stripe && {
        stripeToken: o.billingToken.stripeToken.token.id || o.billingToken.stripeToken.token.card.id,
        requestId: o.billingToken.requestId || o.billingToken.stripeToken.token.card.requestId,
      }),
    }
    return axios({
      method: method,
      url: `${apiBaseUrl}/v3/subscription/subscribe`,
      params: { platform: 'web_browser', site: site },
      headers: { 
        Authorization: token,
        'x-api-key':xApikey
      },
      data: data
    }).then(async (res) => { 
      await subscribeNotificationWs(o,navigateRef)
    return res
  }).catch((err) => {
    pubsub.publish("purchaseError", true)
    pubsub.publish('isLoading', false)
    pubsub.publish('processing', false)
    pubsub.publish('payment-status',{success : false, data : {handleRoute,navigateRef}})
    let planDetails = o?.plan?.planDetails.length && o.plan.planDetails[0]
    let payload = {
      paymentPlan: o.plan?.name,
      country: planDetails?.countryCode,
      value: planDetails?.recurringPaymentAmount,
      currency : planDetails?.recurringPaymentCurrencyCode
  }
    handleSubscriptionAnalytics("FB",FB_EVENTS.SUBSCRIPTION_FAILED,payload)
  })
}

//GA functions

export const addPaymentInfo = (plan,offerCodeDetails) => {
  trackEvent("add_payment_info", {
    currency: plan && plan.planDetails && plan.planDetails[0] && plan.planDetails[0].recurringPaymentCurrencyCode,
    coupon: offerCodeDetails?.code || null,
    payment_type: "Card",
     items: [
      {
        item_id: plan?.id,
        item_name: plan?.name,
        coupon: offerCodeDetails?.code || null,
        price: plan && plan.planDetails && plan.planDetails[0] && plan.planDetails[0].recurringPaymentAmount,
        quantity: 1
      }
    ],
  },null)
}

export const purchaseEvent = (plan,offerCodeDetails,token) => {
  trackEvent("purchase", {
    transaction_id: token?.token?.id || "",
    currency: plan && plan.planDetails && plan.planDetails[0] && plan.planDetails[0].recurringPaymentCurrencyCode,
    coupon: offerCodeDetails?.code || null,
    payment_type: "Card",
     items: [
      {
        item_id: plan?.id,
        item_name: plan?.name,
        coupon: offerCodeDetails?.code || null,
        price: plan && plan.planDetails && plan.planDetails[0] && plan.planDetails[0].recurringPaymentAmount,
        quantity: 1
      }
    ],
  },null)
}