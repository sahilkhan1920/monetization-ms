import localforage from 'localforage';
import { MonetizationStore } from './MonetizationStore'
import pubsub from "@viewlift/pubsub"

export const updateMonetizationStore = (plansData, currentSelectedPlan, firstPayment,subscriptionData) => {
    MonetizationStore.planDetails = plansData ? plansData : MonetizationStore.planDetails
    MonetizationStore.currentSelectedPlan = currentSelectedPlan ? currentSelectedPlan : MonetizationStore.currentSelectedPlan
    MonetizationStore.firstPayment = firstPayment ? firstPayment : MonetizationStore.firstPayment
    MonetizationStore.subscriptionData = subscriptionData ? subscriptionData : MonetizationStore.subscriptionData
    localforage.setItem('MonetizationStore',MonetizationStore)
    pubsub.publish('monetizationStore', MonetizationStore)
} 
export const updateAuthenticationStore =async () => {
    const AuthenticationStore = await localforage.getItem('AuthenticationStore')
    let user = AuthenticationStore?.user
    let updatedUser = {...user,isSubscribed : true}
    localforage.setItem('AuthenticationStore',{...AuthenticationStore,user : updatedUser})
}

