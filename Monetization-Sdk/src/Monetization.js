import React, { useEffect, useState } from 'react';
import pubsub from "@viewlift/pubsub"
import {getPlans} from "./Helpers/helpers"
import Subscribe from './Components/Subscribe/Subscribe';
import "./Monetization.scss"

function Monetization({options,module}) {

  useEffect(() => {
    setTimeout(()=> {
      // pubsub.publish("retrievePlans",getPlans)
      pubsub.publish("userOptions",options)
    },1000)
  },[])
  return (
    <div className="App" style={{height:"100%"}}>
    <Subscribe module={module} />
    </div>
  );
}
export default Monetization;