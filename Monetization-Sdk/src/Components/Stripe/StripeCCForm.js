import React, { useEffect, useState } from 'react'
import StripeForm from './StripeForm'
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js'

const StripeCCForm = ({ moduleData, theme, layout, stripeElStyle, fonts, formRef,currentPlan,firstPayment, metadataMap}) => {
    
    const [stripePromise,setStripePromise] = useState(null)

    const handleStripeObject = async () => {
        let stripeObj = await loadStripe(window?.app_data?.appcmsMain?.paymentProviders?.stripe?.apiKey)
        setStripePromise(stripeObj)
    }
    useEffect(()=> {
    handleStripeObject()
    },[])

    return (<>
        {stripePromise && <div className="billing stripe-container">
            <div className="stripe-form-wrapper">
                    <Elements stripe={stripePromise} >
                        <StripeForm
                            theme={theme || 'dark'}
                            layout={"NEW_SUBSCRIPTION_FLOW"}
                            stripeElStyle={stripeElStyle}
                            buttonCaption="Subscribe Now!"
                            currentPlan={currentPlan}
                            firstPayment={firstPayment}
                            moduleData={moduleData}
                            metadataMap={metadataMap}
                        />
                    </Elements>
            </div>
        </div>}
    </>
    )
}

export default StripeCCForm