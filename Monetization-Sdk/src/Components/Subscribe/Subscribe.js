import React, { useEffect, useState } from 'react'
// import { getSubscriptionMetadata } from '../../Api'
import pubsub from "@viewlift/pubsub"
import "./style.scss"
import SelectPlans from '../Selectplans'
import Purchase from '../Purchase'
import { fetchUserObject } from '../../fetchStore'
import Spinner from '../../../../../components/HomeLoadingScreen/Spinner'

const Subscribe = (props) => {
  const [user,setUser] = useState(null)
  const [metadataMap, setMetadataMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [imageGist, setImageGist] = useState([])
  const handleLoader = (data) => {
    setIsLoading(data)
  }
  const handleMetaData = async () => {
    let metaData = props?.module?.metadataMap
    setMetadataMap(metaData)
    pubsub.publish("metadataMap", metaData)
  }
  const loadStore = async () => {
    const user = await fetchUserObject()
    setUser(user)
  }
  useEffect(() => {
    loadStore()
    handleMetaData()
    pubsub.subscribe("isLoading", handleLoader)
    if(props?.module && props?.module.metadataMap && props?.module.metadataMap.imageList) {
      setImageGist(JSON.parse(props?.module.metadataMap.imageList))
    }
  }, [])
  return (<>
   <div className='subscribe-container'> 
   { isLoading && <Spinner /> } 
   {user && <div className='subscribe'>
      <h3 className='site-color'>{metadataMap?.paymentMethod || 'Select a Payment Method'}</h3>
      <div className='shadow-line'></div>
        <SelectPlans />
        <img className='add-card' src={props?.module?.layout?.settings?.paymentCardImage} alt='add card' />
        <Purchase moduleData={props?.module} purchase={false} metadataMap={metadataMap} />
      </div>}
    </div>
  </>
  )
}

export default Subscribe