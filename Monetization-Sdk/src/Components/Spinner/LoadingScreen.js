import React from 'react'
import Spinner from './Spinner'
import brandlogo from '../../../../../../images/brandLogo.gif'

const LoadingScreen = ({caraousel}) => {
    return (<>

        <div className='loading-screen'>
            <div className='container'>
                {/* <Spinner /> */}
                <div id='brand-loader'><img src={brandlogo} /></div>
            </div>
        </div>
    </>)
}

export default LoadingScreen