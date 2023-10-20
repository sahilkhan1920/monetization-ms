import React, { useEffect, useState } from 'react'
import { CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js'
import StripeInputEl from './StripeInputEl'
import pubsub from "@viewlift/pubsub"
// import { getPaymentHandler, getQueryVariable } from '../../Helpers/helpers'
import { updateMonetizationStore } from '../../updateStore'
import { validateSubscriptionOfferCodeByPlanId, getDiscountPrice } from '../../Api'
import InputEl from "./InputEl"
// import StripeButtons from './StripeButtons'
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { addPaymentInfo } from './helpers'
import { fetchUserDetails } from '../../fetchStore'
import { ANALYTICS } from '../../../../../helpers/analyticsMap'

const CcForm = ({fields, metadataMap,moduleData }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [currentPlan, setCurrentPlan] = useState(null)
    const [validating, setValidating] = useState(false)
    const [offerCodeError, setOfferCodeError] = useState(false)
    const [offerCodeSuccess, setOfferCodeSuccess] = useState(false)
    const [offerCodeDetails, setOfferCodeDetails] = useState({})
    const [offer, setOfferCode] = useState(null)
    const [isValid,setIsValid] = useState(false)
    const getCurrentPlan = (data) => { 
        setCurrentPlan(data)
    }
    const getMonetizationStore = (data) => {
        setCurrentPlan(data.currentSelectedPlan)
    }
    const handleStripeElement = () => {
        const cardElement = elements.getElement(CardNumberElement);
        pubsub.publish("formRef", { elements, stripe, cardElement })
    }
    const getisValid = (data) => {
       setIsValid(data)
    }
    useEffect(() => {
        handleStripeElement()
        updateMonetizationStore()
        pubsub.subscribe('monetizationStore', getMonetizationStore)
        pubsub.subscribe('currentPlan', getCurrentPlan) 
        pubsub.subscribe("stripeComplete",getisValid)
    }, [])

    const onClickApply = async (e) => {
        e.stopPropagation()
        e.preventDefault()
        pubsub.publish('user-analytics',{ename:ANALYTICS.APPLY_COUPON,data:{promotionCode:offerCode}})
        setValidating(true)
        pubsub.publish('isLoading', true)
        const params = new URLSearchParams(window.location.search)
        const paramOffer = params.get('offer')
        let offerCode = paramOffer || (e?.target && e?.target?.value?.toUpperCase()) || offer?.toUpperCase()
        sessionStorage.setItem('offerCode', offerCode)
        let planId = currentPlan.id
        // if (upgradePlanId) {
        //     planId = upgradePlanId
        // } else {
        //     planId = currentPlan.id
        // }
        // const transactionType = props.contentDetails && props.contentDetails.option && props.contentDetails.option.toUpperCase()
        // let offerParam = getQueryVariable('offer')
        // let transactionTypeParam = getQueryVariable('transactionType')
        // const typeNotMatched = offerParam && transactionTypeParam && transactionTypeParam.toUpperCase() !== transactionType
        // if (typeNotMatched && offerCode === offerParam) {
        //     return false
        // }
        if (!offerCodeDetails) {
            setValidating(false)
            pubsub.publish('isLoading', false)
            return false
        }
        const offerValidatePayload = {
            offerCode: offerCode,
            subscriptionPlanId: planId,
            site: window?.app_data?.site?.siteInternalName,
        }
        let validateOfferResponse = await validateSubscriptionOfferCodeByPlanId(offerValidatePayload)
        if (!validateOfferResponse.isError) {
            setValidating(false)
            pubsub.publish('isLoading', false)
            setOfferCodeSuccess(metadataMap?.promoValidatingSuccess || 'Promo Code Applied')
            setOfferCodeDetails({
                displayName: validateOfferResponse.data.displayName,
                name: validateOfferResponse.data.name,
                code: offerCode
            })
            setOfferCode(`${metadataMap.billingOfferAppliedLeft} ${metadataMap.billingOfferAppliedRight} - ${validateOfferResponse.data.displayName || validateOfferResponse.data.name}`)
            getActualPrice()
            setTimeout(() => setOfferCodeSuccess(false), 5000)
        }
        if (validateOfferResponse.isError) {
            setValidating(false)
            pubsub.publish('isLoading', false)
            setOfferCodeError(metadataMap?.promoValidatingError || 'Invalid Promo Code')
            setTimeout(() => setOfferCodeError(false), 5000)
        }
    }
    const removeCode = () => {
        pubsub.publish('isLoading', true)
        sessionStorage.removeItem('offerCode')
        setOfferCodeDetails({})
        setOfferCode("")
        getActualPrice()
    }
    const getActualPrice = async () => {
        let offerCode = sessionStorage.getItem('offerCode') || null
        const data = {
            id: currentPlan.id,
            offerCode: offerCode
        }
        try {
            let res = await getDiscountPrice(data)
            pubsub.publish('firstPayment', res.data)
            pubsub.publish('isLoading', false)
        }
        catch (err) {
            pubsub.publish('isLoading', false)
            let offerStatus = err.response && err.response.data && err.response.data.code
            let localizedError = metadataMap[offerStatus] || metadataMap?.promoValidatingError || "The Offer Code is already used"
            if (offerStatus === "OFFER_ALREADY_USED") {
                sessionStorage.removeItem("offerCode")
            }
        }
    }
    const handleReviewPurchase = async() => {
        addPaymentInfo(currentPlan, offerCodeDetails)
        pubsub.publish('user-analytics',{ename:ANALYTICS.ADD_PAYMENT_INFO,data:currentPlan});
        pubsub.publish('progressState', 2)
    }
    const disableCtaColor = moduleData?.layout?.settings?.disabledCTAColor || 'transparent'
    const activeCtaColor = moduleData?.layout?.settings?.activeCTAColor || 'transparent'
    return (
        <div>
            <StripeInputEl
                El={CardNumberElement}
                moduleData={moduleData}
                title={fields.cardNumberText || 'Card Number'}
                // title={'Card Number'}
                 />
            <div className="exp-cvc">
                <StripeInputEl
                    El={CardExpiryElement}
                    moduleData={moduleData}
                    title={fields.expiryText || 'Expiry'}
                    // title='Expiry'
                     />
                <InputEl
                    title={fields.nameText || 'Name'}
                    moduleData={moduleData}
                    // title={'Name'}
                    name="customer_name" />
                <div className='form-2'>
                    <StripeInputEl
                        El={CardCvcElement}
                        moduleData={moduleData}
                        isCvc={true}
                        title={fields.cvcText || 'CVV'}
                        // title='CVC'
                         />
                    {currentPlan && <div className='offer-container'>
                        <div className='coupon-input'>
                            <input
                                className={`offer-code-input ${Object.keys(offerCodeDetails).length > 0 ? "applied-code" : ""}`}
                                placeholder={metadataMap?.addPromoPlaceholder || 'Add Promo'}
                                onChange={(e) => {
                                setOfferCode(e.target.value)
                                    let applyCodeBtn = document.querySelector(".apply")
                                if (e.target.value){
                                    applyCodeBtn.style.background = moduleData?.layout?.settings?.activeCTAColor}
                                else applyCodeBtn.style.background = "rgba(255, 255, 255, 0.3)"
                                }
                                }
                                onKeyPress={e => { if (e.key === 'Enter') onClickApply(e) }}
                                value={offer}
                                style={{background: moduleData?.layout?.settings?.inputColor || "transparent"}}
                            />
                            {Object.keys(offerCodeDetails).length > 0 &&
                                <button
                                    aria-label="cancel"
                                    className="remove-code-btn  site-cta-color site-cta-background-color "
                                    onClick={() => {
                                        removeCode(false)
                                    }}>
                                    {metadataMap?.cancelPromo || 'cancel'}
                                </button>
                            }
                            {!offerCodeSuccess && Object.keys(offerCodeDetails).length == 0 && <button
                                aria-label="apply"
                                className={`apply site-cta-color ${validating ? ' processing' : ''}`}
                                onClick={(e) => onClickApply(e)}>
                                {validating ? metadataMap?.processingTxt || 'Processing' : metadataMap?.applyCode || 'Apply Code'}
                            </button>}
                        </div>
                    </div>}
                </div>
            </div>
            <input
                className={`${!isValid? 'button continue-button disabled' : 'button continue-button site-cta-color '}`}
                disabled={isValid ? false : true}
                onClick={() => handleReviewPurchase()}
                type="button"
                value={metadataMap?.addCard || 'Add Card'}
                style={!isValid ? {background: disableCtaColor} : {background : activeCtaColor}}
            />
            {offerCodeError && <div className="error notice-text">{offerCodeError} </div>}
            {offerCodeSuccess && <div className='success notice-text'>{offerCodeSuccess} </div>}
        </div>
    )
}

export default CcForm