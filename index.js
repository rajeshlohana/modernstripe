
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = 8080;

//app.use("/pay", express.raw({ type: "*/*" }));

app.use(express.json({
  type: "*/*"
}))

//app.use(express.json());
app.use(cors());

app.get('/', async (req, res) => {
	res.send('api is live to accept payment calls');
})

app.post('/pay',async (req, res)=>{
try {
	console.log('Subscriber Name : ' + JSON.parse(req.body).name);	
	console.log('Subscription Requested : ' + JSON.parse(req.body).subsReq);	
	console.log('Subscription referralId : ' + JSON.parse(req.body).referralId);	
	
	const name = JSON.parse(req.body).name;
	const subsReq = JSON.parse(req.body).subsReq;
	const referralId = JSON.parse(req.body).referralId;
	

	let subsAmount = 0;
	if ((subsReq.toString() === 'Monthly') && ((referralId.toString() === 'General') || (referralId.toString() === ''))) {
		subsAmount = 15*100 
	}
	if ((subsReq.toString() === 'Monthly') && ((referralId.toString() !== 'General') && (referralId.toString() !== ''))) {
		subsAmount = 12*100 
	}
 
	if ((subsReq.toString() === 'Yearly') && ((referralId.toString() === 'General') || (referralId.toString() === ''))) {
		subsAmount = 110*100
	}

	if ((subsReq.toString() === 'Yearly') && ((referralId.toString() !== 'General') && (referralId.toString() !== ''))) {
		subsAmount = 100*100
	}

	if (!name) return res.status(400).json({message: 'Please enter name' });
	const paymentIntent = await stripe.paymentIntents.create({
		amount: (subsAmount), // req.body.amount
		currency: 'usd',
		payment_method_types: ["card"], // automatic_payment_methods: { enable: true }
		metadata: {name: name}
	});
	const clientSecret = paymentIntent.client_secret;
	res.json({message: 'Payment Initiated', clientSecret });



} catch(err) {
	console.log(err);
	res.status(500).json({message: 'Internal Server Error'})
}
});

app.post('/stripe', async (req,res) => {
	const sig = req.headers['stripe-signature'];
	let event;
	try {
		event = await stripe.webhooks.constructEvent(
				req.body, 
				sig, 
				process.env.STRIPE_WEBHOOK_SOCKET
			);
			
	} catch(err) {
		console.error(err);
		res.status(500).json({message: 'Internal Server Error'})
	}

	// Event when a payment is initiated

	if (event.type === "payment_intent.created") {
		console.log(`${event.data.object.metadata.name} initiated payment`);
	}

	// Event when a payment is succeeded

	if (event.type === "payment_intent.succeeded") {
		console.log(`${event.data.object.metadata.name} succeeded payment`);
	}

	res.json({ ok: true });

	});


app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));

