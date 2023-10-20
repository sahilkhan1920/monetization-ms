import React, { useState } from 'react'
import { getAddress } from '../../Api'
const InputEl = ({moduleData, name,title}) => {

    const [valid,setValid] = useState(false)
    const onChange = async (e) => {
        let isValid = !!e.target.value
        if (valid !== isValid) setValid(isValid)
        if (name === 'address_zip'){
          if (e && e.target.value && e.target.value.length > 3){
            let addressResponse = await getAddress(e.target.value)
            console.log(addressResponse)}
        }
      }
      let inputStyle = {
        margin : "4px 0 !important",
        background  : moduleData?.layout?.settings?.inputColor || "transparent"
      }
  return (<>
    <div className={
        `our-input ${name} ticked`
      } style={inputStyle}>
        {/* <div className="title">{title}</div> */}
        <input
        className='input-el'
          type="text"
          onChange={ e => onChange(e) }
          placeholder={ title } 
          name={name} />
      </div>
  </>)
}

export default InputEl