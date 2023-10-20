export const StripeScript = () => {
    const existingScript = document.getElementById('stripeV3JS');
     if (!existingScript) {
        return new Promise((resolve, reject) => {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.id = 'stripeV3JS';
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => {
                resolve();
            }
            script.onerror = () => {
                reject('Cannot load stripe')
                document.head.removeChild(script);
            }
            document.head.appendChild(script);
        })
    }
}
