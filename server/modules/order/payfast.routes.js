const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const Order    = require('./order.model');
const { sendOrderEmail } = require('../../utils/emailService');

const respond = (res, status, data) =>
  res.status(status).json({ success: status < 400, ...data });

// ── PayFast ITN (Instant Transaction Notification) ────────────
router.post('/notify', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const data    = req.body;
    const orderId = data.m_payment_id;
    if (!orderId) return res.status(200).send('OK');

    const pfSignature = data.signature;
    const dataCopy    = { ...data };
    delete dataCopy.signature;

    let paramString = Object.entries(dataCopy)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`)
      .join('&');

    if (process.env.PAYFAST_PASSPHRASE) {
      paramString += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE.trim())}`;
    }

    const computed = crypto.createHash('md5').update(paramString).digest('hex');
    if (computed !== pfSignature) {
      console.error('PayFast signature mismatch');
      return res.status(200).send('OK');
    }

    if (data.payment_status === 'COMPLETE') {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus:    'paid',
          status:           'confirmed',
          confirmedAt:      new Date(),
          transactionId:    data.pf_payment_id || null,
          paymentReference: data.m_payment_id  || null,
        },
        { new: true }
      ).populate('user', 'firstName lastName email');

      if (order) await sendOrderEmail('confirmed', order);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('PayFast notify error:', err.message);
    res.status(200).send('OK');
  }
});

module.exports = router;
