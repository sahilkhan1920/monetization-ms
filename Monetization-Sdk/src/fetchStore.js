import localforage from "localforage"
import { getToken } from "./helper"
export const fetchUserDetails = async () => {
    const AuthenticationStore = await localforage.getItem('AuthenticationStore')
    if (!AuthenticationStore) return {}
    let user = AuthenticationStore && AuthenticationStore.user
    let token = await getToken(token => {return token})
    let profileId=AuthenticationStore.user?.profiles[0]?.profileId
    return {token : token, userId : user?.userId,profileId:profileId}
} 
export const fetchUserObject = async () => {
    const AuthenticationStore = await localforage.getItem('AuthenticationStore')
    let user = AuthenticationStore?.user
    return user
}

export const fetchMonetizationStore = async () => {
    const MonetizationStore = await localforage.getItem('MonetizationStore')
    return MonetizationStore
 }
export const fetchSubscriptionObject = async () => {
    const MonetizationStore = await localforage.getItem('MonetizationStore')
    let subscriptionData = MonetizationStore?.subscriptionData
    return subscriptionData
}