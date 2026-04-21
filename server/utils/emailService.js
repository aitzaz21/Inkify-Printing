const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Inkify Printing" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    return { success: true };
  } catch (err) {
    console.error('Email error:', err.message);
    return { success: false };
  }
};

// ── Brand wrapper ─────────────────────────────────────────────
const shell = (content) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inkify Printing</title></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(135deg,rgba(107,66,38,0.12),rgba(16,12,10,0.98));border:1px solid rgba(107,66,38,0.25);border-radius:16px;overflow:hidden;">
  <tr><td style="padding:32px 40px 0;">
    <div style="display:inline-block;background:linear-gradient(135deg,#6B4226,#8B5A3C);padding:10px 20px;border-radius:8px;margin-bottom:28px;">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:2px;">INKIFY</span>
      <span style="color:rgba(255,255,255,0.5);font-size:18px;font-weight:300;letter-spacing:2px;"> PRINTING</span>
    </div>
  </td></tr>
  <tr><td style="padding:0 40px 40px;">${content}</td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);">
    <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;text-align:center;">
      © ${new Date().getFullYear()} Inkify Printing · All rights reserved
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

const h1  = (t) => `<h1 style="color:#fff;font-size:24px;font-weight:600;margin:0 0 12px;">${t}</h1>`;
const p   = (t) => `<p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.7;margin:0 0 16px;">${t}</p>`;
const hr  = ()  => `<div style="height:1px;background:rgba(255,255,255,0.07);margin:20px 0;"></div>`;

const otpBox = (otp) => `
<div style="text-align:center;margin:28px 0;">
  <div style="display:inline-block;background:rgba(107,66,38,0.2);border:2px solid rgba(107,66,38,0.5);border-radius:12px;padding:20px 48px;">
    <span style="color:#fff;font-size:40px;font-weight:700;letter-spacing:12px;">${otp}</span>
  </div>
</div>`;

const statusBadge = (label, color) => `
<div style="display:inline-block;padding:6px 16px;border-radius:30px;background:${color}20;border:1px solid ${color}40;color:${color};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${label}</div>`;

const orderTable = (order) => `
<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:20px;margin:20px 0;">
  <p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Order ${order.orderNumber}</p>
  ${order.items.map(i => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:rgba(255,255,255,0.7);font-size:13px;">${i.productName} · ${i.color} / ${i.size} × ${i.quantity}</span>
      <span style="color:#fff;font-size:13px;font-weight:600;">PKR ${Math.round(i.unitPrice * i.quantity).toLocaleString()}</span>
    </div>`).join('')}
  <div style="display:flex;justify-content:space-between;padding:12px 0 0;">
    <span style="color:rgba(255,255,255,0.4);font-size:13px;">Total</span>
    <span style="color:#8B5A3C;font-size:16px;font-weight:700;">PKR ${Math.round(order.total).toLocaleString()}</span>
  </div>
</div>`;

// ── OTP Emails ────────────────────────────────────────────────
const sendVerificationOTP = (email, firstName, otp) =>
  sendEmail({
    to: email,
    subject: 'Verify your Inkify Printing account',
    html: shell(
      h1('Verify Your Email') +
      p(`Hello ${firstName}, your one-time verification code is:`) +
      otpBox(otp) +
      p('This code expires in <strong style="color:#8B5A3C">10 minutes</strong>. Do not share it with anyone.')
    ),
  });

const sendPasswordResetOTP = (email, firstName, otp) =>
  sendEmail({
    to: email,
    subject: 'Reset your Inkify Printing password',
    html: shell(
      h1('Password Reset') +
      p(`Hello ${firstName}, use this code to reset your password:`) +
      otpBox(otp) +
      p('Expires in <strong style="color:#8B5A3C">10 minutes</strong>. If you did not request this, ignore this email.')
    ),
  });

// ── Order Lifecycle Emails ────────────────────────────────────
const sendOrderEmail = async (type, order) => {
  if (!order?.user?.email) return;
  const { email, firstName } = order.user;

  const templates = {
    placed: {
      subject: `Order confirmed — ${order.orderNumber}`,
      html: shell(
        h1('Order Received! 🎉') +
        statusBadge('Order Placed', '#6B4226') +
        '<br><br>' +
        p(`Hi ${firstName}, we've received your order and our team is reviewing it.`) +
        orderTable(order) +
        p('You will receive another email once your order is confirmed and in production.')
      ),
    },
    confirmed: {
      subject: `Your order is in production — ${order.orderNumber}`,
      html: shell(
        h1('In Production 🖨️') +
        statusBadge('Confirmed', '#3b82f6') +
        '<br><br>' +
        p(`Great news ${firstName}! Your order <strong style="color:#8B5A3C">${order.orderNumber}</strong> is confirmed and now being printed.`) +
        p('We\'ll notify you as soon as it ships.')
      ),
    },
    dispatched: {
      subject: `Your order is on its way — ${order.orderNumber}`,
      html: shell(
        h1('On Its Way! 🚚') +
        statusBadge('Dispatched', '#f97316') +
        '<br><br>' +
        p(`Your order <strong style="color:#8B5A3C">${order.orderNumber}</strong> has been dispatched and is on its way to you.`) +
        p('Thank you for choosing Inkify Printing.')
      ),
    },
    delivered: {
      subject: `Your order has been delivered — ${order.orderNumber}`,
      html: shell(
        h1('Delivered! ✅') +
        statusBadge('Delivered', '#22c55e') +
        '<br><br>' +
        p(`Hi ${firstName}, your order <strong style="color:#8B5A3C">${order.orderNumber}</strong> has been marked as delivered.`) +
        p('We hope you love your custom Inkify shirt! Thank you for your support.')
      ),
    },
  };

  const tmpl = templates[type];
  if (!tmpl) return;
  return sendEmail({ to: email, ...tmpl });
};

// ── Design Status Emails ──────────────────────────────────────
const sendDesignStatusEmail = async (status, design, reason = '') => {
  if (!design?.creator?.email) return;
  const { email, firstName } = design.creator;

  const templates = {
    approved: {
      subject: `Your design "${design.title}" is now live! 🎉`,
      html: shell(
        h1('Design Approved! 🎉') +
        statusBadge('Approved', '#22c55e') +
        '<br><br>' +
        p(`Hi ${firstName}, your design <strong style="color:#8B5A3C">"${design.title}"</strong> has been approved and is now live on the Inkify marketplace.`) +
        p('Customers can now discover and purchase shirts featuring your design. You\'ll be notified each time your design is sold.')
      ),
    },
    rejected: {
      subject: `Update on your design "${design.title}"`,
      html: shell(
        h1('Design Not Approved') +
        statusBadge('Not Approved', '#ef4444') +
        '<br><br>' +
        p(`Hi ${firstName}, your design <strong style="color:#8B5A3C">"${design.title}"</strong> could not be approved at this time.`) +
        (reason ? p(`<strong style="color:rgba(255,255,255,0.8)">Reason:</strong> ${reason}`) : '') +
        p('You\'re welcome to revise and resubmit. If you have questions, please contact our support team.')
      ),
    },
  };

  const tmpl = templates[status];
  if (!tmpl) return;
  return sendEmail({ to: email, ...tmpl });
};

// ── Designer Payment Emails ───────────────────────────────────
const sendDesignSoldEmail = async (designerEmail, firstName, designTitle, amount) => {
  return sendEmail({
    to: designerEmail,
    subject: `Your design "${designTitle}" was just sold! 🎉`,
    html: shell(
      h1('Design Sold! 🎉') +
      p(`Hi ${firstName}, your design <strong style="color:#8B5A3C">"${designTitle}"</strong> was just purchased!`) +
      `<div style="background:rgba(107,66,38,0.15);border:1px solid rgba(107,66,38,0.3);border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your Earnings</p>
        <p style="color:#8B5A3C;font-size:32px;font-weight:700;margin:0;">PKR ${Math.round(amount)}</p>
      </div>` +
      p('Your earnings will be processed within 3-5 business days. You can track your pending balance in your profile.')
    ),
  });
};

const sendPaymentCompleteEmail = async (designerEmail, firstName, amount) => {
  return sendEmail({
    to: designerEmail,
    subject: 'Your Inkify earnings have been paid! 💸',
    html: shell(
      h1('Payment Sent! 💸') +
      p(`Hi ${firstName}, your Inkify designer earnings of <strong style="color:#8B5A3C">PKR ${Math.round(amount).toLocaleString()}</strong> have been sent to your registered payment account.`) +
      hr() +
      p('If you have any questions about your payment, please contact our support team.')
    ),
  });
};

const sendOrderReversalEmail = async (order, reason) => {
  if (!order?.user?.email) return;
  const { email, firstName } = order.user;
  return sendEmail({
    to: email,
    subject: `Order ${order.orderNumber} has been reversed`,
    html: shell(
      h1('Order Reversed') +
      statusBadge('Reversed', '#ef4444') +
      '<br><br>' +
      p(`Hi ${firstName}, your order <strong style="color:#8B5A3C">${order.orderNumber}</strong> has been reversed.`) +
      (reason ? p(`<strong style="color:rgba(255,255,255,0.8)">Reason:</strong> ${reason}`) : '') +
      p('If you paid online, a refund will be processed to your original payment method within 3-7 business days. For COD orders, no charge applies.') +
      p('If you have questions, please reach out to our support team.')
    ),
  });
};

const sendWithdrawalStatusEmail = async (designerEmail, firstName, amount, status, adminNote) => {
  const approved = status === 'approved';
  return sendEmail({
    to: designerEmail,
    subject: approved
      ? `Withdrawal of PKR ${Math.round(amount).toLocaleString()} Approved! 💸`
      : `Withdrawal Request Update`,
    html: shell(
      h1(approved ? 'Withdrawal Approved! 💸' : 'Withdrawal Request Update') +
      statusBadge(approved ? 'Approved' : 'Not Approved', approved ? '#22c55e' : '#ef4444') +
      '<br><br>' +
      (approved
        ? p(`Hi ${firstName}, your withdrawal request of <strong style="color:#8B5A3C">PKR ${Math.round(amount).toLocaleString()}</strong> has been approved and payment has been sent to your registered account.`)
        : p(`Hi ${firstName}, your withdrawal request of <strong style="color:#8B5A3C">PKR ${Math.round(amount).toLocaleString()}</strong> could not be processed at this time.`)
      ) +
      (adminNote ? p(`<strong style="color:rgba(255,255,255,0.8)">Note from admin:</strong> ${adminNote}`) : '') +
      hr() +
      p('Log in to your Inkify account to view your earnings dashboard.')
    ),
  });
};

module.exports = {
  sendEmail,
  sendVerificationOTP,
  sendPasswordResetOTP,
  sendOrderEmail,
  sendOrderReversalEmail,
  sendDesignStatusEmail,
  sendDesignSoldEmail,
  sendPaymentCompleteEmail,
  sendWithdrawalStatusEmail,
};
