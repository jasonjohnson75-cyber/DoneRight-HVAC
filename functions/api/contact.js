export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const data = await request.json();
    const name = String(data.Name || '').trim();
    const phone = String(data.Phone || '').trim();
    const email = String(data.Email || '').trim();
    const subject = String(data.Subject || '').trim();
    const comments = String(data.Comments || '').trim();

    if (!name || !phone || !email || !subject || !comments) {
      return Response.json({ error: 'Please complete all fields.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!env.RESEND_API_KEY) {
      return Response.json({ error: 'Email service is not configured.' }, { status: 503 });
    }

    const safe = (v) => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Done Right Website <website@doneright.cc>',
        to: ['servicedonerightllc@gmail.com'],
        reply_to: email,
        subject: 'Website Contact: ' + subject.slice(0, 120),
        html: '<h2>New Done Right Website Inquiry</h2>' +
          '<p><strong>Name:</strong> ' + safe(name) + '</p>' +
          '<p><strong>Phone:</strong> ' + safe(phone) + '</p>' +
          '<p><strong>Email:</strong> ' + safe(email) + '</p>' +
          '<p><strong>Subject:</strong> ' + safe(subject) + '</p>' +
          '<p><strong>Comments:</strong></p><p>' + safe(comments).replace(/\n/g,'<br>') + '</p>'
      })
    });
    if (!response.ok) {
      return Response.json({ error: 'Email delivery failed.' }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
