// Import Libraries
var Q = require('q');
var httpRequest = require('request');
var paypal_ipn = require('paypal-ipn');

// Environment Variables
var PAYPAL_RECEIVER_EMAIL = process.env.PAYPAL_RECEIVER_EMAIL;
var PAYPAL_RECEIVER_CURRENCY = process.env.PAYPAL_RECEIVER_CURRENCY;


/*******

Paypal - an online payments service
http://paypal.com/

*******/
module.exports = function(app){

    // Instant Payments Notification Callback
    app.post("/pay/paypal/ipn",function(request,response){

        var transaction = request.body;

        // Verify with Paypal
        paypal_ipn.verify(transaction, function callback(err, msg) {
            if(err){
                console.log("Payment IPN Invalid");
                console.error(msg);
                return;
            }else{
                
                // Assure payment is Completed
                if(transaction.payment_status!='Completed') {
                    console.log("Payment not completed");
                    return;
                }

                // Assure currency is USD, not tampered with
                if(transaction.mc_currency!="USD") {
                    console.log("Payment is wrong currency");
                    return;
                }           
                
                // Assure you're the intended recipient
                if(transaction.receiver_email != PAYPAL_RECEIVER_EMAIL){
                    console.log("Payment email spoof");
                    return;
                }

                // Parse metadata, which was hidden in Custom.
    			var metadata = JSON.parse(transaction.custom);

                // Log Transaction
                app.logTransaction({

                    item_id: metadata.item_id,
                    amount: transaction.mc_gross,
                    custom: metadata.custom,

                    payment_method: "paypal",
                    payment_data: transaction

                }).then(function(){
    				response.send("Transaction logged!");
    			});	

            }
        });

    });

    // When payment complete, show Payment Success page.
    app.get("/pay/paypal/success",function(request,response){
        var id = request.query.tx;
        if(id){
            app.renderTransaction({ "payment_data.txn_id": id },response);
        }else{
            response.send("No such Coinbase transaction found! If you think something's gone wrong, please email us at: prize@isios7jailbrokenyet.com. Sorry!");
        }
    });

};