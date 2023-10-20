export const AmazonScript = () => {
    const existingScript = document.getElementById('amazonJS');
     if (!existingScript) {
        return new Promise((resolve, reject) => {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.id = 'amazonJS';
            script.src = 'https://static-na.payments-amazon.com/OffAmazonPayments/us/sandbox/js/Widgets.js';
            script.onload = () => {
                resolve();
            }
            script.onerror = () => {
                reject('Cannot load amazon js')
                document.head.removeChild(script);
            }
            document.head.appendChild(script);
        })
    }
}