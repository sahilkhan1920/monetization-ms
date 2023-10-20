import React from 'react';
import ReactDOM from "react-dom";
import { MonetizationWrapper } from './MonetizationWrapper';
const root = document.getElementById("root")
let {Monetization,options } = MonetizationWrapper()
const mount = (root : any) => {
  ReactDOM.render(<Monetization options={options} module={null} />,root);
} 

mount(root)

export {mount}
