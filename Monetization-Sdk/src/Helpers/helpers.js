import { getSubscriptionPlans, getInvisiblePlans } from "../Api"
import getSymbolFromCurrency from 'currency-symbol-map'
export function getPriceFormat (pd, plan, firstPayment) {
    const frequencyMap = {
        MONTH : 'month',
        YEAR : 'year',
        DAY : 'day', 
        WEEK: 'week'
      }
    const actualPrice = (pd.recurringPaymentAmount)
    let currencySymbol = getSymbolFromCurrency(pd.recurringPaymentCurrencyCode)
    const discountedPrice = firstPayment && firstPayment.amount !== actualPrice ? firstPayment && firstPayment.amount === 0 ? '0' : (firstPayment && firstPayment.amount) : null
    function price(){
      if(discountedPrice){
        window.discountedPrice = true
        return ' '+currencySymbol+' '+discountedPrice
      }else{
        window.discountedPrice = false
        return ' '+currencySymbol+' '+(pd.introductoryPrice || pd.recurringPaymentAmount)+' '
      }
    }
    if(plan?.renewalCyclePeriodMultiplier)
      return price()+' / '+ (plan?.renewalCyclePeriodMultiplier > 1 ?  plan?.renewalCyclePeriodMultiplier : '') + frequencyMap[plan?.renewalCycleType] + (plan?.renewalCyclePeriodMultiplier > 1 ? 's' : '')+' '
      
    if(!plan.renewalCyclePeriodMultiplier)
        return price()
  }
  
  export const getQueryVariable = (variable) => {
    if (!window.location.search) return
  
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) === variable) {
          return decodeURIComponent(pair[1]);
      }
    }
  }
export const getPlans = () => {
    let storedPlan = sessionStorage.getItem("planId")
    const params = new URLSearchParams(window.location.search)
    const planId = params && params.get('planId')
    let paramsPlan = params && params.get('forwardParams')
    if (!paramsPlan && storedPlan && storedPlan.length > 0) {
        sessionStorage.removeItem("plans");
    }
    if (planId) {
        sessionStorage.setItem('planId', planId)
    }
    
    if (storedPlan) {
     return getInvisiblePlans()
    }else {
      return getSubscriptionPlans()
    }
}

export const getPaymentHandler = () => {
  var country = window.page_data.countryCode
  if (window?.app_data?.appcmsMain?.paymentProviders?.juspay?.country === country) { 
    return "Juspay"
  } else { // When JusPay is not enabled then Either ccavenue or SSL or Strip will run
    var providers = window.app_data.appcmsMain.paymentProviders
    for (var k in providers) {
      if (providers[k]?.country?.includes(country)) {
        sessionStorage.setItem('paymentHandler',k)
        return k
      }
    }
    for (k in providers) {
      if (providers[k]?.country?.includes('ROW')) {
        sessionStorage.setItem('paymentHandler',k)
        return k
      }
    }
    sessionStorage.setItem('paymentHandler','Stripe')
    return 'Stripe'
}
}
