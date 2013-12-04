// Import Libraries
var Q = require('q');
var httpRequest = require('request');
var util = require('util'); 

// Environment Variables
var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;


/*******
Stripe payments
*******/

module.exports = function(app){

	 // Charge a card and log the transaction
	 app.post("/pay/stripe",function(request,response){

		request.assert('amount', 'Amount is required').isDecimal();   //Validate amount
		request.assert('item_id', 'A valid item id is required').equals(0);  //Validate item_id
		request.assert(['custom', 'email'], 'No email - we need one!').isEmail();  //Validate email field
		request.assert(['custom', 'newsletter'], 'Issue with the newsletter form field').isAlpha();  //Validate newsletter field

		 var errors = request.validationErrors();
		 if (errors) {
		 	response.send('There have been validation errors: ' + util.inspect(errors), 400);
			return;
		 }

		Q.fcall(function(){

		   // Charge card
		   return callStripe("charges",{
			card: request.body.stripeToken,
			amount: Math.round(request.body.amount*100), // Converting to USD cents.
			currency: "usd"
		   });

		}).then(function(chargeData){

			// It gets returned as a JSON string, ugh.
			chargeData = JSON.parse(chargeData);

			// Log transaction with Custom Vars
			return app.logTransaction({

				 item_id: request.body.item_id,
				 amount: (chargeData.amount/100), // Converting to USD dollars
				 custom: request.body.custom,

				 payment_method: "stripe",
				 payment_data: chargeData

			});

		}).then(function(transaction){
			response.redirect("/paid?id="+transaction._id);
		},function(err){
			console.log(err);
			response.end();
		});

	 });

};


// Helper method: Make a Stripe API call, with promise.
function callStripe(url,params){

	var deferred = Q.defer();

	httpRequest.post({
	  
		url: "https://api.stripe.com/v1/"+url,
		auth: {
		   user: STRIPE_SECRET_KEY,
		   pass: "",
		   sendImmediately: true
		},
		form: params

	}, function(error,response,body){

		if(error){
		   return deferred.reject(new Error());
		}

		deferred.resolve(body);
	});

	return deferred.promise;
}
