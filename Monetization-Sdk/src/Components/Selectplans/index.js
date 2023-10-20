import React, { useState, useEffect } from 'react'
import pubsub from "@viewlift/pubsub"
import "./style.scss"
import { MonetizationStore } from '../../MonetizationStore'
import { updateMonetizationStore } from "../../updateStore"
import { getPriceFormat } from "../../Helpers/helpers"
import { getDiscountPrice } from '../../Api'
// import  msnLogo  from '../../assets/msnLogo.png'
import { getPlans } from '../../Helpers/helpers'

const SelectPlans = () => {

    const [plans, setPlans] = useState([])
    const [currentPlan, setCurrentPlan] = useState([])
    const [discountedData, setDiscountedData] = useState(null)
    const [actualPrice, setActualPrice] = useState(null)
    const [firstPayment, setFirstPayment] = useState({})
    async function getPlansDetails() {
        let plan
        let plansData = null
        let currentStoredPlan = JSON.parse(sessionStorage.getItem("currentPlan"))
        if (currentStoredPlan) {
            plan = currentStoredPlan
        }else {
            let plansData = await getPlans()
            plan = plansData && plansData[0]
            sessionStorage.setItem("currentPlan", JSON.stringify(plan))
        }
            setPlans(plansData)
            setCurrentPlan(plan)
            updateMonetizationStore(plansData,plan)
            handleDiscountedPrice(plan)
    }
    function handleSelectedPlanDetails(e) {
        pubsub.publish('isLoading',true)
        let currentIndex = document.getElementById("plan").selectedIndex;
        setCurrentPlan(plans[currentIndex])
        pubsub.publish('currentPlan',plans[currentIndex])
        handleDiscountedPrice(plans[currentIndex])
        sessionStorage.setItem('currentPlan',JSON.stringify(plans[currentIndex]))
    }
    async function handleDiscountedPrice(plan) {
        let discount = await getDiscountPrice(plan)
        updateMonetizationStore(null, plan,discount?.data)
        pubsub.publish('firstPayment',discount?.data)
        pubsub.publish('isLoading',false)
    }
    const firstPaymentFormat = (data) => {
        let date = new Date(data?.nextBillingDate);
        date = date.toLocaleString('en-US')
        setFirstPayment({ data, date })
    }
    const handleFirstPayment = (data) => {
        firstPaymentFormat(data)
        let plan = MonetizationStore?.currentSelectedPlan
        let discountedData = getPriceFormat(plan?.planDetails[0], plan,data)
        setActualPrice(plan?.planDetails[0]?.recurringPaymentAmount)
        setDiscountedData(discountedData)
        updateMonetizationStore(null, null,data)
    }
    useEffect(() => {
        getPlansDetails()
        // pubsub.subscribe('retrievePlans', getPlans)
        pubsub.subscribe('firstPayment',handleFirstPayment)
        
    }, [])
    return (
        <div className='selected-plans-container site-color'>
            <div className='change-selected-plan site-background-color '>
            <div className='payment-logo'>
                <img src={window?.app_data?.appcmsPlatform?.images?.desktopLogo} alt="logo" />
            </div>
            <div className='plan-details'>
            {currentPlan && <p className='site-color' id="plan" >{currentPlan?.name}</p>}
                <div className='details'>
                    <div className='billing-date'>{firstPayment && firstPayment.date && firstPayment.date.split(",")[0]}</div>
                <div className='billing-price site-color'>
                    {(plans && discountedData) ?
                        <div className='billing-price'>{window.discountedPrice ? 
                            <span>{discountedData.split("/")[0]}<span className='discounted-price'>${actualPrice} </span> / {discountedData.split("/")[1]}</span> : 
                            <span>{discountedData}</span>}</div> : <></>}
                            </div>
                </div>
                </div>
            </div>
        </div>
    )
}

export default SelectPlans