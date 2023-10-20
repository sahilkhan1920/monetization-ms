import React from 'react'
import InputEl from "./InputEl"

const AddressForm = ({fields}) => {
  return (<>
  <div>
        <InputEl
          title={fields.nameOnCard}
          name="customer_name"/>
        <InputEl
          title={fields.streetAddress} />
        <div className="zip-city">
          <InputEl
            title={fields.zipCode}
            name="address_zip"/>
          <InputEl
            title={fields.city}
            name="address_city" />
        </div>
      
        <div className="state-country">
          <InputEl
            title={fields.state}
            name="address_state"/>
          
          <InputEl
            title={fields.country}
            name="address_country" />
        </div>
        {/* {this.props.layout !== "NEW_SUBSCRIPTION_FLOW" && this.props.leftContent} */}
      </div>  
  </>
  )
}

export default AddressForm