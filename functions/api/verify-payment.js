function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    if (!env.RAZORPAY_KEY_SECRET) {
      return Response.json({ verified: false, error: 'Razorpay secret is not configured.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    if (!orderId || !paymentId || !signature) {
      return Response.json({ verified: false, error: 'Missing payment verification fields.' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${paymentId}`));
    const expected = hex(signed);
    const verified = expected === signature;

    return Response.json({ verified }, { status: verified ? 200 : 400 });
  } catch (error) {
    return Response.json({ verified: false, error: 'Unable to verify payment.' }, { status: 500 });
  }
}
