export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return Response.json({ error: 'Razorpay credentials are not configured.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 100) {
      return Response.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const receipt = `arulmilk_${Date.now()}`;
    const rzResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          purpose: 'Fresh cow milk test order',
          business: 'Arul Dairy & Cow Care Farm'
        }
      })
    });

    const data = await rzResponse.json();
    if (!rzResponse.ok) {
      return Response.json({ error: data?.error?.description || 'Unable to create Razorpay order.' }, { status: rzResponse.status });
    }

    return Response.json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    return Response.json({ error: 'Unable to create order.' }, { status: 500 });
  }
}
