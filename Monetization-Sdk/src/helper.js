import jwtDecode from "jwt-decode";
import Cookies from 'js-cookie'
import localforage from "localforage"
import axios from "axios"
import pubsub from "@viewlift/pubsub"
import {getDeviceId} from '../../../helpers'


let tokenData;

function decodeToken(token) {
    var authToken = jwtDecode(token);
    var tokenExp = authToken.exp
    var date = new Date(tokenExp * 1000);
    return date
  }

  export function setToken(res) {
    if (!res || !res.authorizationToken){
      throw(new Error('Invalid request to update token'))
    }
    var tokenExpiryTime = decodeToken(res.authorizationToken)
    tokenData = {
      expiration: tokenExpiryTime.getTime(),
      authorizationToken: res.authorizationToken,
      refreshToken: res.refreshToken,
      duration: tokenExpiryTime.getTime() - new Date().getTime(),
    }
    Cookies.set('token', JSON.stringify(tokenData),{ expires:  365})
   return tokenData
  }

const generateId = _ => {
    const s4 = _ => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}


export async function getToken(cb) {
  let appToken = Cookies.get("app-token")
  if (appToken) return appToken
  const AuthenticationStore = await localforage.getItem('AuthenticationStore')
  let user = AuthenticationStore?.user
  let userData = user ? user : {}
  let anonToken = Cookies.get('token') && JSON.parse(Cookies.get('token'))
    
  return new Promise((resolve, reject) => {

    if(window.fetchToken){
      setTimeout(() => {
        getToken(cb)
      },500)
    }
    if (user?.authorizationToken || anonToken?.authorizationToken ) {
      let currentToken = user?.authorizationToken || anonToken?.authorizationToken 
      var tokenExpiryTime = decodeToken(currentToken)
      var now = new Date().getTime();
      if (now < tokenExpiryTime) {
        if (cb) cb(currentToken)
        resolve(currentToken)
        window.fetchToken = false
        return
      }
    }

    if (tokenData?.refreshToken || (userData && Object.keys(userData).length > 0) && !window.fetchingRefreshToken) {
      
      // console.log('refreshing token')
      window.fetchingRefreshToken = true
      axios({
        method: 'GET',
        url: `${ window.apiBaseUrl }/identity/refresh/${ tokenData?.refreshToken || userData?.refreshToken }`,
      }).then( res => {
        var d = res.data && {
          authorizationToken: res.data.authorizationToken,
          refreshToken: res.data.refreshToken
        }
        setToken(d)
        localforage.setItem('AuthenticationStore',{user:{...user,...d}})
        if (cb) cb(d?.authorizationToken, d?.refreshToken)
        window.fetchToken = false
        window.fetchingRefreshToken = false
        resolve(d.authorizationToken, tokenData?.refreshToken)
      }).catch(err => {
        window.fetchToken = false
        console.error('Error refreshing token', err)
        window.fetchingRefreshToken = false
        localforage.clear();
        window.location.assign("/");
        // clearToken()
        // reject(err)
      })
      return
    }

    // If user, remove user
    var url = `${ window?.apiBaseUrl}/identity/anonymous-token`
    

    // Fetch token
    if(!window.fetchToken){

      var deviceId = getDeviceId();

      axios({
        method: "GET",
        url: url,
        params: {
           site: window?.app_data?.site?.siteInternalName,
           platform : "web_browser",
           deviceId: deviceId
           },
        headers: {
          "x-api-key": window?.xApiKey
        }
      })
      .then(res => {
        var d = res.data && { authorizationToken: res.data.authorizationToken };
        setToken(d);
        window.fetchToken= false
        if (cb) cb(d.authorizationToken, d.refreshToken);
        resolve(d.authorizationToken, d.refreshToken);
      })
      .catch(err => {
        window.fetchToken = false
        console.error("Error fetching anonymous token", err);
        pubsub.publish('isLoading',false)
        reject(err);
      });
    }
  })
}