import React, { useEffect, useState } from 'react'
import pubsub from "@viewlift/pubsub"
import './style.scss'

const StripeInputEl = ({El, theme, style, title, moduleData,isCvc }) => {
  const [valid, setValid] = useState(false)
  const [titleHead, setTitleHead] = useState(false)
  let debounceTimer
  const verifyInputs = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(()=> {
      const isCompleted = document.getElementsByClassName("StripeElement StripeElement--complete")
      if (isCompleted.length == 3) {
        pubsub.publish("stripeComplete",true)
      }else {
        pubsub.publish("stripeComplete",false)
      }
    },500)
  }
  let inputStyle = {
    background  : moduleData?.layout?.settings?.inputColor || "transparent",
  }
  return (<>
    <div className={`stripe-input title-head ${titleHead ? "title-head" : ""} ${valid ? ' ticked site-color-before' : ''} ${isCvc ? "cvc-input" : ""}`} style={inputStyle}>
      {/* <div className="title">{title}</div> */}
      <El
        options={{
          placeholder : title || '',
          style: {   
            base: {
              color: '#FFF',
              fontSize : "14px",
              '::placeholder': {
                color: '#d1d1d1',
              }
            }
          }
        }}
        onBlur={(e) => verifyInputs()}
        onChange={(e)=> verifyInputs()} />
    </div>
  </>
  )
}

export default StripeInputEl