import axios from "axios"
import {fetchUserDetails} from "./fetchStore"
import {getToken} from "./helper"
import { updateAuthenticationStore, updateMonetizationStore } from "./updateStore"
import pubsub from "@viewlift/pubsub"
import localforage from "localforage"
import { fetchUserData, pushToDatalayer } from "../../../helpers"
let xApikey = window?.xApiKey
let apiBaseUrl = window.apiBaseUrl
let site = window?.app_data?.site?.siteInternalName
let countryCode = window?.app_data?.countryCode || "IN"

export const getSubscriptionPlans =  async() => {
  try {
    let token = await getToken(token => {return token})
    let { userId } = await fetchUserDetails()
      let res = await axios.get(`${apiBaseUrl}/subscription/plans?site=${site}&userId=${userId}&device=web_browser&monetizationModel=SVOD&platform=web_browser`,
      {
        headers: {
          'x-api-key': xApikey,
          authorization : token
        }
      })
      return res.data
  } catch(e) {
    pubsub.publish('isLoading', false)
  }
  }

  export const getInvisiblePlans = async () => {
    try {
      let token = await getToken(token => {return token})
      let { userId } = await fetchUserDetails()
      let res = await axios({
        method: 'GET',
        url: `${apiBaseUrl }/subscription/plans`,
        params: { site: site,
          userId: userId,
          ids: sessionStorage.getItem('plans'),
          device: 'web_browser', 
          allPlans: true 
        },
        headers: { 
          Authorization: token,
          'x-api-key': xApikey
        }
      })
      return res.data
    }
    catch(e) {
      pubsub.publish('isLoading', false)
    }
  } 
  export var getDiscountPrice = async (data) => {
    let token = await getToken(token => {return token})
          return axios ({
            method: 'GET',
            url: `${apiBaseUrl}/subscription/calculate/discount`,
            params: {
              // userId: userId,
              countryCode: countryCode,
              planId: data?.id,
              site: site,
          offerCode: data?.offerCode || null,
          transactionType: data?.transactionType || null
            },
            headers: {
              Authorization: token,
              'x-api-key': xApikey
            }
          }).catch(()=> {
            pubsub.publish('isLoading', false)
          })
  }

  export const validateSubscriptionOfferCodeByPlanId = async (payload) => {
    try {
      let token = await getToken(token => {return token})
      const response = await axios({
        method: 'POST',
        url: `${apiBaseUrl}/subscription/offer/validate`,
        params: { site: site },
        data: payload,
        headers: { 
          Authorization: token,
          'x-api-key': xApikey
        }
      })
      return {
        isError: false,
        data: response.data
      }
    } catch (error) {
      return {
        isError: true,
        code:(error.response && error.response.data && error.response.data.code),
        error: (error.response && error.response.data && error.response.data.message) || 'An error occuredd. Try again later'
      }
    }
  }

  export const getSubscriptionMetadata = async (paylaod) => {

    let token = await getToken(token => {return token})
    var contentApiHeaders = {
      Authorization: token,
      'x-api-key': xApikey,
    }
    const response = await axios({
      method: "GET",
      url: `${apiBaseUrl}/content/pages?path=/subscription&languageCode=default&includeContent=true&countryCode=IN&site=${site}`,
      headers: contentApiHeaders
    })
    return response && response.data && response.data.modules && response.data.modules[0].metadataMap
  }

  export const getAddress = (value) => {
    return axios.get(`https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${value}&key=AIzaSyCjULGl-zqfHzWOrRwHpanj3q7uXHM4OPY`)
    .then( response =>{
      if(response.data.results.length > 0){
        const results = response.data.results[0]
        let address = {
          country: (find(results['address_components'], (item)=>{return item.types.includes('country')}))['short_name'],
          state: (find(results['address_components'], (item) => { return item.types.includes('administrative_area_level_1') }))['short_name'],
          city: (find(results['address_components'], (item) => { 
            return item.types.includes('locality') || item.types.includes('postal_town') 
          }))['short_name']
        }
        return address
      }
    })
  }

  export const subscriptionData = async () => {
    try {
      let token = await getToken(token => {return token})
      let { userId } = await fetchUserDetails()
        return axios({
          method: 'GET',
          url: `${ apiBaseUrl }/subscription/user`,
          params: { site: site, userId: userId },
          headers: { 
            Authorization:token,   
            'x-api-key': xApikey
          }
        }).then(async (res) => {
          let token = await getToken(token => {return token})
          let {userId} = await fetchUserDetails()
            return fetchUserData(userId, token).then((userdata) => {
              localforage.getItem('AuthenticationStore').then((store) => {
                localforage.setItem('AuthenticationStore',{user: {...store.user, ...userdata.data}})
                        pubsub.publish('AuthenticationStore', store)
                    })
            return res.data
        })
      })
    } 
    catch(e) {
    pubsub.publish('isLoading', false)
    pubsub.publish('processing',false)
    }
  }

//  export const fetchUserSubscription = async () => {
//   let token = await getToken(token => {return token})
//   let {userId} = await fetchUserDetails()
//    return axios({
//     method: 'GET',
//     url: `${ apiBaseUrl }/identity/user`,
//     params: { site:site, userId: userId, platform : "web_browser"},
//     headers: { 
//       Authorization: token,   
//       'x-api-key': xApikey  
//     }
//   })
//   .then((res) => {
//     return res
//   })
//  }
  export const subscriptionStore = async (handleRoute,navigateRef) => {
    try {
        let res = await subscriptionData()
        if(res?.subscriptionInfo?.paymentUniqueId) {
          pushToDatalayer('transaction_completed', res?.subscriptionInfo?.paymentUniqueId);
        }
        updateMonetizationStore(null,null,null,res)
        updateAuthenticationStore()
        pubsub.publish('processing',false)
        let justSubscribed = true
        let nextRoute = handleRoute(justSubscribed)
        nextRoute.then((res) => {
          setTimeout(()=> {
            navigateRef.current(res);
          },200)
        })
    }
    catch(e) {
      pubsub.publish('isLoading', false)
      pubsub.publish('processing',false)
    }
  }