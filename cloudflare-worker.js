// Cloudflare Worker for Unshakable Families Store
// This handles Stripe checkout, ShipStation orders, and Mailchimp bonus delivery

// ===== CONFIGURATION =====
// Environment variables are configured in Cloudflare Workers dashboard:
// - STRIPE_SECRET_KEY (required)
// - SHIPSTATION_API_KEY (optional)
// - SHIPSTATION_API_SECRET (optional)
// - MAILCHIMP_API_KEY (optional)
// - MAILCHIMP_SERVER_PREFIX (optional)
// - MAILCHIMP_LIST_ID (optional)

// Your website URL
const SITE_URL = 'https://unshakable-families-site.pages.dev';

// Product Price IDs from Stripe
const PRICE_IDS = {
    // Bundle Products
    'prod_TKMYdi0tJ8PihI': 'price_1SNhpqENTZGZDoIEfi6rFMQN', // Bundle English
    'prod_TKMZUqoZ3N0UqW': 'price_1SNhqTENTZGZDoIEeEG3CazL', // Bundle Spanish

    // Unshakable Products
    'prod_TKMQIIUotITNZo': 'price_1SNhhNENTZGZDoIEJ1qhRhFI', // Unshakable Paperback English
    'prod_TKMSsIjIYBf5Ev': 'price_1SNhj9ENTZGZDoIEade9RdRT', // Unshakable Paperback Spanish
    'prod_TKMTKRgsWddE83': 'price_1SNhkLENTZGZDoIELjfoA8tY', // Unshakable Ebook English
    'prod_TKMTfrTuMRr7c3': 'price_1SNhkZENTZGZDoIEjl4bfDHk', // Unshakable Ebook Spanish

    // Fire on the Family Altar Products
    'prod_TKMUdCfcPzrqrm': 'price_1SNhl7ENTZGZDoIEdv8igmrL', // Fire Paperback English
    'prod_TKMUV9sItr20yy': 'price_1SNhlTENTZGZDoIETaFD5Pap', // Fire Paperback Spanish
    'prod_TKMU12ym0FzbZM': 'price_1SNhlmENTZGZDoIEH9KmZcwY', // Fire Ebook English
    'prod_TKMVhWKaAW2sZf': 'price_1SNhm4ENTZGZDoIEbQtJY67i', // Fire Ebook Spanish

    // Ebook Bundles
    'prod_TKnXjt9xf5qOze': 'price_1SO7wbENTZGZDoIELabzVT7m', // Ebook Bundle English
    'prod_TKnW58ssyIRVGf': 'price_1SO7vnENTZGZDoIE6y5VEqUq', // Ebook Bundle Spanish

    // Recommendation Products (English)
    'rec_prayer_saturated_church': 'price_1SO7xQENTZGZDoIEwuTNlQh4', // Prayer Saturated Church
    'rec_prayer_saturated_family': 'price_1SO80EENTZGZDoIEzA7pWAe4', // Prayer Saturated Family
    'rec_prayer_saturated_kids': 'price_1SO81oENTZGZDoIE4LcprMsj', // Prayer Saturated Kids (English)
    'rec_prayer_saturated_kids_es': 'price_1SO82eENTZGZDoIEousRiLA5', // Prayer Saturated Kids (Español)
    'rec_reclaim_generation': 'price_1SO83OENTZGZDoIELTB7Ea3k', // Reclaim a Generation
    'rec_two_nations': 'price_1SO84GENTZGZDoIEgLiDJL3a', // Two Nations One Prayer (English)
    'rec_two_nations_es': 'price_1SO85VENTZGZDoIEMQ2ujNqG', // Two Nations One Prayer (Español)

    // Free Bonus Items
    'prod_TL15QCP70baXz8': 'price_1SOL2yENTZGZDoIEndRZQzvZ', // 30-Day Unshakable Action Guide (FREE)
    'prod_TL15L4IFBZtld8': 'price_1SOL3RENTZGZDoIEyoSJ4lFh' // 10-Day Family Prayer Guide (FREE)
};

// ===== MAIN HANDLER =====
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Enable CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Route handlers
        if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
            return handleCreateCheckout(request, env, corsHeaders);
        }

        if (url.pathname === '/api/get-shipping-rates' && request.method === 'POST') {
            return handleGetShippingRates(request, env, corsHeaders);
        }

        if (url.pathname === '/api/webhook' && request.method === 'POST') {
            return handleStripeWebhook(request, env);
        }

        if (url.pathname === '/api/send-contact-email' && request.method === 'POST') {
            return handleSendContactEmail(request, env, corsHeaders);
        }

        if (url.pathname === '/api/add-mailchimp-lead' && request.method === 'POST') {
            return handleAddMailchimpLead(request, env, corsHeaders);
        }

        if (url.pathname === '/api/send-booking-request' && request.method === 'POST') {
            return handleSendBookingRequest(request, env, corsHeaders);
        }

        return new Response('Not Found', { status: 404 });
    }
};

// ===== GET SHIPPING RATES FROM SHIPSTATION =====
async function handleGetShippingRates(request, env, corsHeaders) {
    try {
        const { cart, address, cartTotal } = await request.json();

        // Check if cart qualifies for free shipping
        const FREE_SHIPPING_THRESHOLD = 100;
        const qualifiesForFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;

        // If qualifies for free shipping, return USPS Media Mail at $0
        if (qualifiesForFreeShipping) {
            return new Response(JSON.stringify({
                rates: [{
                    serviceName: 'USPS Media Mail',
                    serviceCode: 'usps_media_mail',
                    shipmentCost: 0,
                    otherCost: 0,
                    isFreeShipping: true
                }]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Skip if ShipStation is not configured
        if (!env.SHIPSTATION_API_KEY || !env.SHIPSTATION_API_SECRET) {
            throw new Error('ShipStation not configured');
        }

        // Calculate total weight from cart items
        const totalWeight = cart.reduce((total, item) => {
            return total + ((item.weight || 0) * item.quantity);
        }, 0);

        if (totalWeight === 0) {
            throw new Error('No physical products with weight in cart');
        }

        const auth = btoa(`${env.SHIPSTATION_API_KEY}:${env.SHIPSTATION_API_SECRET}`);

        const baseRateRequest = {
            packageCode: 'package',
            fromPostalCode: '85001', // Phoenix, AZ
            toState: address.state,
            toCountry: address.country || 'US',
            toPostalCode: address.postalCode,
            toCity: address.city,
            weight: {
                value: totalWeight,
                units: 'ounces'
            },
            dimensions: {
                units: 'inches',
                length: 12,
                width: 9,
                height: 3
            },
            confirmation: 'none',
            residential: true
        };

        // Request USPS rates
        const uspsRequest = {
            ...baseRateRequest,
            carrierCode: 'stamps_com',
            serviceCode: null
        };

        console.log('ShipStation USPS rate request:', JSON.stringify(uspsRequest));

        const uspsResponse = await fetch('https://ssapi.shipstation.com/shipments/getrates', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uspsRequest)
        });

        let allRates = [];

        if (uspsResponse.ok) {
            const uspsRates = await uspsResponse.json();
            console.log('USPS rates received:', JSON.stringify(uspsRates));
            allRates = allRates.concat(uspsRates);
        }

        // Request FedEx rates - try with carrier ID first
        const fedexRequestWithId = {
            ...baseRateRequest,
            carrierCode: 'se-576579',
            serviceCode: null
        };

        console.log('ShipStation FedEx rate request (with carrier ID):', JSON.stringify(fedexRequestWithId));

        let fedexResponse = await fetch('https://ssapi.shipstation.com/shipments/getrates', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fedexRequestWithId)
        });

        if (fedexResponse.ok) {
            const fedexRates = await fedexResponse.json();
            console.log('FedEx rates received:', JSON.stringify(fedexRates));
            allRates = allRates.concat(fedexRates);
        } else {
            const fedexError = await fedexResponse.text();
            console.error('FedEx rate request failed (carrier ID):', fedexResponse.status, fedexError);

            // Try again with generic 'fedex' code
            const fedexRequest = {
                ...baseRateRequest,
                carrierCode: 'fedex',
                serviceCode: null
            };

            console.log('ShipStation FedEx rate request (generic):', JSON.stringify(fedexRequest));

            fedexResponse = await fetch('https://ssapi.shipstation.com/shipments/getrates', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fedexRequest)
            });

            if (fedexResponse.ok) {
                const fedexRates = await fedexResponse.json();
                console.log('FedEx rates received (generic):', JSON.stringify(fedexRates));
                allRates = allRates.concat(fedexRates);
            } else {
                const fedexError2 = await fedexResponse.text();
                console.error('FedEx rate request failed (generic):', fedexResponse.status, fedexError2);
            }
        }

        // Filter for specific services only (exact match)
        const desiredServices = [
            'usps_media_mail',
            'usps_priority_mail',
            'fedex_express_saver',
            'fedex_standard_overnight',  // FedEx Next Day
            'fedex_priority_overnight'   // FedEx Next Day (alternative)
        ];

        const filteredRates = allRates
            .filter(rate => {
                const serviceCode = (rate.serviceCode || '').toLowerCase();
                // Use exact match instead of includes to avoid matching express variants
                return desiredServices.includes(serviceCode);
            })
            .map(rate => ({
                serviceName: rate.serviceName,
                serviceCode: rate.serviceCode,
                shipmentCost: rate.shipmentCost,
                otherCost: rate.otherCost,
                isFreeShipping: false
            }))
            .sort((a, b) => a.shipmentCost - b.shipmentCost); // Sort by price

        console.log('Filtered rates:', JSON.stringify(filteredRates));

        return new Response(JSON.stringify({ rates: filteredRates }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get rates error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            rates: []
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== SEND CONTACT FORM EMAIL =====
async function handleSendContactEmail(request, env, corsHeaders) {
    try {
        const { name, email, subject, message, leadTag } = await request.json();

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Add to Mailchimp if leadTag provided
        if (leadTag) {
            await addLeadToMailchimp(email, name, leadTag, env);
        }

        // Send email using Mandrill API (Mailchimp's transactional email service)
        const emailResponse = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: env.MANDRILL_API_KEY,
                message: {
                    from_email: 'noreply@bridgebuilders.net',
                    from_name: 'Unshakable Families Contact Form',
                    to: [
                        {
                            email: 'contact@bridgebuilders.net',
                            type: 'to'
                        }
                    ],
                    subject: `Contact Form: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">New Contact Form Submission</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Name:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Subject:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${subject}</td>
                                </tr>
                            </table>
                            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #4CAF50;">
                                <h3 style="margin-top: 0;">Message:</h3>
                                <p style="white-space: pre-wrap;">${message}</p>
                            </div>
                            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                                Sent from: ${request.headers.get('referer') || 'Direct'}
                            </p>
                        </div>
                    `,
                    text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nSent from: ${request.headers.get('referer') || 'Direct'}`,
                    headers: {
                        'Reply-To': email
                    }
                }
            })
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Mandrill error status:', emailResponse.status);
            console.error('Mandrill error body:', errorText);

            // Still add to Mailchimp even if email fails
            // Return success since the lead was captured
            return new Response(JSON.stringify({
                success: true,
                message: 'Your message was received and added to our contact list. We will respond via email shortly.',
                emailSent: false
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Email sent successfully'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error sending contact email:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== SEND BOOKING REQUEST EMAIL =====
async function handleSendBookingRequest(request, env, corsHeaders) {
    try {
        const { firstName, lastName, organization, phone, email, bookingType, message, speakerName } = await request.json();

        // Validate required fields
        if (!firstName || !lastName || !email || !bookingType || !speakerName) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Send email using Mandrill API
        const emailResponse = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: env.MANDRILL_API_KEY,
                message: {
                    from_email: 'noreply@bridgebuilders.net',
                    from_name: 'Unshakable Families Booking Request',
                    to: [
                        {
                            email: 'contact@bridgebuilders.net',
                            type: 'to'
                        }
                    ],
                    subject: `Speaking Engagement Request: ${speakerName} - ${bookingType}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">New Speaking Engagement Request</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Speaker:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${speakerName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Booking Type:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${bookingType}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">First Name:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${firstName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Last Name:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${lastName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
                                </tr>
                                ${phone ? `
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Phone:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${phone}">${phone}</a></td>
                                </tr>
                                ` : ''}
                                ${organization ? `
                                <tr>
                                    <td style="padding: 10px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Organization:</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${organization}</td>
                                </tr>
                                ` : ''}
                            </table>
                            ${message ? `
                            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #4CAF50;">
                                <h3 style="margin-top: 0;">Message:</h3>
                                <p style="white-space: pre-wrap;">${message}</p>
                            </div>
                            ` : ''}
                            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                                Sent from: ${request.headers.get('referer') || 'Direct'}
                            </p>
                        </div>
                    `,
                    text: `New speaking engagement request:\n\nSpeaker: ${speakerName}\nBooking Type: ${bookingType}\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}${organization ? `\nOrganization: ${organization}` : ''}\n\n${message ? `Message:\n${message}\n\n` : ''}---\nSent from: ${request.headers.get('referer') || 'Direct'}`,
                    headers: {
                        'Reply-To': email
                    }
                }
            })
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Mandrill error status:', emailResponse.status);
            console.error('Mandrill error body:', errorText);

            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to send booking request. Please try again or email us directly at contact@bridgebuilders.net',
                emailSent: false
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Booking request sent successfully! We will contact you shortly.'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error sending booking request:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== ADD LEAD TO MAILCHIMP API ENDPOINT =====
async function handleAddMailchimpLead(request, env, corsHeaders) {
    try {
        const { name, email, leadTag } = await request.json();

        // Validate required fields
        if (!name || !email || !leadTag) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Add to Mailchimp
        await addLeadToMailchimp(email, name, leadTag, env);

        return new Response(JSON.stringify({
            success: true,
            message: 'Lead added to Mailchimp'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error adding lead to Mailchimp:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== ENSURE 10% DISCOUNT COUPON EXISTS =====
async function ensureCoupon(env) {
    const couponId = 'addon_discount_10';

    // Try to retrieve existing coupon
    const getCoupon = await fetch(`https://api.stripe.com/v1/coupons/${couponId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        }
    });

    if (getCoupon.ok) {
        // Coupon exists, return its ID
        return couponId;
    }

    // Coupon doesn't exist, create it
    const createCoupon = await fetch('https://api.stripe.com/v1/coupons', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'id': couponId,
            'percent_off': '10',
            'duration': 'once',
            'name': '10% Add-On Discount'
        })
    });

    const couponData = await createCoupon.json();

    if (!createCoupon.ok) {
        console.error('Failed to create coupon:', couponData);
        // Return null if coupon creation fails - checkout will proceed without discount
        return null;
    }

    return couponId;
}

// ===== CREATE CHECKOUT SESSION =====
async function handleCreateCheckout(request, env, corsHeaders) {
    try {
        const { lineItems, cart, hasRecommendation, cartTotal, hasPhysicalProducts, shippingAddress, shippingRate } = await request.json();

        // Prepare line items for Stripe
        const stripeLineItems = cart.map(item => ({
            price: PRICE_IDS[item.id],
            quantity: item.quantity
        }));

        // Create or get 10% discount coupon if needed
        let couponId = null;
        if (hasRecommendation) {
            couponId = await ensureCoupon(env);
        }

        // Create Stripe Checkout Session
        const session = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: (() => {
                const params = new URLSearchParams();
                params.append('success_url', `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`);
                params.append('cancel_url', `${SITE_URL}/cart.html`);
                params.append('mode', 'payment');
                params.append('phone_number_collection[enabled]', 'true');
                params.append('metadata[cart]', JSON.stringify(cart));

                // If physical products and shipping address provided from cart
                if (hasPhysicalProducts && shippingAddress && shippingRate) {
                    // Don't collect shipping address - we already have it from cart
                    // Use the selected shipping rate from ShipStation
                    const shippingCost = shippingRate.isFreeShipping ? 0 : Math.round(shippingRate.shipmentCost * 100);
                    params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
                    params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', shippingCost.toString());
                    params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
                    params.append('shipping_options[0][shipping_rate_data][display_name]', shippingRate.serviceName);

                    // Store shipping address and details in metadata for ShipStation
                    params.append('metadata[shipping_method]', shippingRate.serviceCode);
                    params.append('metadata[shipping_cost]', shippingRate.shipmentCost.toString());
                    params.append('metadata[shipping_street]', shippingAddress.street);
                    params.append('metadata[shipping_city]', shippingAddress.city);
                    params.append('metadata[shipping_state]', shippingAddress.state);
                    params.append('metadata[shipping_postal_code]', shippingAddress.postalCode);
                    params.append('metadata[shipping_country]', shippingAddress.country);

                    // Store gift recipient name if this is a gift
                    if (shippingAddress.isGift && shippingAddress.giftRecipientName) {
                        params.append('metadata[is_gift]', 'true');
                        params.append('metadata[gift_recipient_name]', shippingAddress.giftRecipientName);
                    }
                } else if (hasPhysicalProducts) {
                    // Fallback to old logic if no shipping rate selected
                    const FREE_SHIPPING_THRESHOLD = 100;
                    const qualifiesForFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;

                    params.append('shipping_address_collection[allowed_countries][]', 'US');
                    params.append('shipping_address_collection[allowed_countries][]', 'CA');

                    if (qualifiesForFreeShipping) {
                        params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
                        params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '0');
                        params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
                        params.append('shipping_options[0][shipping_rate_data][display_name]', 'Free Shipping');
                    } else {
                        params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
                        params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '599');
                        params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
                        params.append('shipping_options[0][shipping_rate_data][display_name]', 'Standard Shipping');
                        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
                        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '5');
                        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
                        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '7');
                    }
                }

                stripeLineItems.forEach((item, index) => {
                    params.append(`line_items[${index}][price]`, item.price);
                    params.append(`line_items[${index}][quantity]`, item.quantity.toString());
                });

                // Apply 10% discount coupon if customer added recommendation items
                if (couponId) {
                    params.append('discounts[0][coupon]', couponId);
                }

                return params;
            })()
        });

        const sessionData = await session.json();

        if (!session.ok) {
            throw new Error(sessionData.error?.message || 'Failed to create checkout session');
        }

        return new Response(JSON.stringify({ sessionId: sessionData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== STRIPE WEBHOOK HANDLER =====
async function handleStripeWebhook(request, env) {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    // Verify webhook signature (in production, implement proper verification)
    // const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

    try {
        const event = JSON.parse(body);

        // Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Get customer details
            const customerEmail = session.customer_details?.email;
            const customerName = session.customer_details?.name;
            const cart = JSON.parse(session.metadata?.cart || '[]');

            // Extract shipping address (same logic as ShipStation)
            let shippingAddress;
            if (session.metadata?.shipping_street) {
                // Address came from cart form
                const recipientName = session.metadata.gift_recipient_name || session.customer_details?.name;
                shippingAddress = {
                    name: recipientName,
                    street1: session.metadata.shipping_street,
                    street2: null,
                    city: session.metadata.shipping_city,
                    state: session.metadata.shipping_state,
                    postalCode: session.metadata.shipping_postal_code,
                    country: session.metadata.shipping_country,
                    phone: session.customer_details?.phone
                };
            } else {
                // Address came from Stripe checkout form (fallback)
                const stripeAddress = session.shipping_details?.address;
                shippingAddress = {
                    name: stripeAddress?.name || session.customer_details?.name,
                    street1: stripeAddress?.line1,
                    street2: stripeAddress?.line2,
                    city: stripeAddress?.city,
                    state: stripeAddress?.state,
                    postalCode: stripeAddress?.postal_code,
                    country: stripeAddress?.country,
                    phone: session.customer_details?.phone
                };
            }

            // 1. Create ShipStation order (for physical products)
            await createShipStationOrder(session, cart, shippingAddress, env);

            // 2. Send bonuses via Mailchimp
            const isGift = session.metadata?.is_gift === 'true';
            await sendBonusesViaMailchimp(customerEmail, customerName, cart, shippingAddress, isGift, env);

            // 3. Track conversion (add to analytics if needed)
            console.log('Order completed:', session.id);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ===== SHIPSTATION INTEGRATION =====
async function createShipStationOrder(session, cart, shippingAddress, env) {
    // Only create order if cart contains physical products
    const hasPhysicalProducts = cart.some(item =>
        item.type === 'bundle' || item.type === 'paperback'
    );

    if (!hasPhysicalProducts) {
        console.log('No physical products, skipping ShipStation');
        return;
    }

    // Skip if ShipStation is not configured
    if (!env.SHIPSTATION_API_KEY || !env.SHIPSTATION_API_SECRET) {
        console.log('ShipStation not configured, skipping');
        return;
    }

    const orderItems = cart
        .filter(item => item.type === 'bundle' || item.type === 'paperback')
        .map(item => ({
            name: item.name,
            sku: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            weight: {
                value: 12, // Estimate 12 ounces per book
                units: "ounces"
            }
        }));

    const shippingCost = session.metadata?.shipping_cost ? parseFloat(session.metadata.shipping_cost) : 0;
    const productCost = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const shippingMethod = session.metadata?.shipping_method || '';

    // Map shipping method to ShipStation service names for requestedShippingService
    let requestedService = null;
    if (shippingMethod) {
        if (shippingMethod.includes('media_mail') || shippingMethod.includes('Media Mail')) {
            requestedService = 'USPS Media Mail';
        } else if (shippingMethod.includes('priority_mail_express') || shippingMethod.includes('Priority Mail Express')) {
            requestedService = 'USPS Priority Mail Express';
        } else if (shippingMethod.includes('priority') || shippingMethod.includes('Priority Mail')) {
            requestedService = 'USPS Priority Mail';
        } else if (shippingMethod.includes('first_class') || shippingMethod.includes('First Class')) {
            requestedService = 'USPS First Class Mail';
        } else if (shippingMethod.includes('ground_advantage') || shippingMethod.includes('Ground Advantage')) {
            requestedService = 'USPS Ground Advantage';
        } else if (shippingMethod.includes('parcel_select') || shippingMethod.includes('Parcel Select')) {
            requestedService = 'USPS Parcel Select Ground';
        }
    }

    // Calculate ship by date (2 business days from now)
    const now = new Date();
    const shipByDate = new Date(now);
    shipByDate.setDate(shipByDate.getDate() + 2);

    // Format dates for ShipStation (ShipStation expects 7 decimal places: 2015-06-29T08:46:27.0000000)
    const formatDate = (date) => date.toISOString().split('.')[0] + '.0000000';

    const orderData = {
        orderNumber: session.id,
        orderKey: session.payment_intent || session.id,
        orderDate: formatDate(now),
        paymentDate: formatDate(now),
        shipByDate: formatDate(shipByDate),
        orderStatus: 'awaiting_shipment',
        paymentMethod: 'Credit Card',
        customerEmail: session.customer_details?.email,
        customerUsername: session.customer_details?.name,
        billTo: {
            name: shippingAddress.name,
            company: null,
            street1: shippingAddress.street1,
            street2: shippingAddress.street2,
            street3: null,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            residential: true
        },
        shipTo: {
            name: shippingAddress.name,
            company: null,
            street1: shippingAddress.street1,
            street2: shippingAddress.street2,
            street3: null,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            residential: true
        },
        items: orderItems,
        orderTotal: productCost,
        amountPaid: session.amount_total / 100,
        shippingAmount: shippingCost,
        taxAmount: 0,
        customerNotes: `Stripe Payment ID: ${session.payment_intent}\nPaid: ${formatDate(now)}`,
        internalNotes: `Stripe Checkout Session: ${session.id}\nShip By: ${formatDate(shipByDate)}\nShipping Method: ${shippingMethod}`,
        requestedShippingService: requestedService,
        advancedOptions: {
            storeId: 373617,
            customField1: `Paid: ${formatDate(now)}`,
            customField2: `Ship By: ${formatDate(shipByDate)}`,
            customField3: `Stripe: ${session.payment_intent}`
        }
    };

    console.log('ShipStation using shippingAddress:', JSON.stringify(shippingAddress));

    try {
        const auth = btoa(`${env.SHIPSTATION_API_KEY}:${env.SHIPSTATION_API_SECRET}`);

        const response = await fetch('https://ssapi.shipstation.com/orders/createorder', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ShipStation API error:', response.status, errorText);
            console.error('Order data sent:', JSON.stringify(orderData, null, 2));
            throw new Error(`ShipStation error: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('ShipStation order created:', result.orderId);
        return result;

    } catch (error) {
        console.error('ShipStation error:', error);
        // Don't fail the webhook if ShipStation fails
        // Log error and handle manually if needed
    }
}

// ===== MAILCHIMP INTEGRATION =====
async function sendBonusesViaMailchimp(email, name, cart, shippingAddress, isGift, env) {
    // Skip if Mailchimp is not configured
    if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_SERVER_PREFIX || !env.MAILCHIMP_LIST_ID) {
        console.log('Mailchimp not configured, skipping');
        return;
    }

    try {
        // Add subscriber to Mailchimp (using PUT for create or update)
        // Generate subscriber hash (MD5 of lowercase email)
        const subscriberHash = generateMD5Hash(email.toLowerCase());

        // If this is a gift, don't include shipping address (it's for the recipient, not the buyer)
        const mergeFields = {
            FNAME: name?.split(' ')[0] || '',
            LNAME: name?.split(' ').slice(1).join(' ') || ''
        };

        if (!isGift) {
            // Only add address fields if this is NOT a gift
            mergeFields.ADDRESS = {
                addr1: shippingAddress?.street1 || '',
                addr2: shippingAddress?.street2 || '',
                city: shippingAddress?.city || '',
                state: shippingAddress?.state || '',
                zip: shippingAddress?.postalCode || '',
                country: shippingAddress?.country || ''
            };
            mergeFields.PHONE = shippingAddress?.phone || '';
            mergeFields.ZIPCODE = shippingAddress?.postalCode || '';
            mergeFields.STATE = shippingAddress?.state || '';
        }

        const subscriberData = {
            email_address: email,
            status_if_new: 'subscribed',
            merge_fields: mergeFields
        };

        // Add tags based on purchase
        const tags = [];

        // Check which books were purchased
        const hasUnshakable = cart.some(item =>
            item.id.includes('TKMYdi0tJ8PihI') || // Bundle English
            item.id.includes('TKMZ') || // Bundle Spanish
            item.id.includes('TKMQ') || // Unshakable PB English
            item.id.includes('TKMS') || // Unshakable PB Spanish
            item.id.includes('TKMT') || // Unshakable Ebook English
            item.id.includes('TKnX')    // Ebook Bundle
        );

        const hasFire = cart.some(item =>
            item.id.includes('TKMYdi0tJ8PihI') || // Bundle English
            item.id.includes('TKMZ') || // Bundle Spanish
            item.id.includes('TKMU') || // Fire books (all variants)
            item.id.includes('TKnX')    // Ebook Bundle
        );

        const hasPrayerSaturatedChurch = cart.some(item => item.id.includes('rec_prayer_saturated_church'));
        const hasPrayerSaturatedFamily = cart.some(item => item.id.includes('rec_prayer_saturated_family'));
        const hasPrayerSaturatedKids = cart.some(item =>
            item.id.includes('rec_prayer_saturated_kids')
        );
        const hasReclaimGeneration = cart.some(item => item.id.includes('rec_reclaim_generation'));
        const hasTwoNations = cart.some(item => item.id.includes('rec_two_nations'));

        // Journey tags (only if this is NOT a gift - buyer is participating, not recipient)
        if (!isGift) {
            if (hasUnshakable) {
                tags.push('UNSHAKABLE_25-Journey-Active');
            }
            if (hasFire) {
                tags.push('FIREONTHEFAMILY_25-Journey-Active');
            }
        }

        // Category tags for each book purchased
        if (hasUnshakable) {
            tags.push('CATEGORY_Purchased-Book-Unshakable');
        }
        if (hasFire) {
            tags.push('CATEGORY_Purchased-Book-Fire_on_the_Family_Altar');
        }
        if (hasPrayerSaturatedChurch) {
            tags.push('CATEGORY_Purchased-Book-Prayer_Saturated_Church');
        }
        if (hasPrayerSaturatedFamily) {
            tags.push('CATEGORY_Purchased-Book-Prayer_Saturated_Family');
        }
        if (hasPrayerSaturatedKids) {
            tags.push('CATEGORY_Purchased-Book-Prayer_Saturated_Kids');
        }
        if (hasReclaimGeneration) {
            tags.push('CATEGORY_Purchased-Book-Reclaim_a_Generation');
        }
        if (hasTwoNations) {
            tags.push('CATEGORY_Purchased-Book-Two_Nations_One_Prayer');
        }

        console.log('Sending to Mailchimp:', JSON.stringify(subscriberData, null, 2));

        const response = await fetch(
            `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${env.MAILCHIMP_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriberData)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mailchimp API error:', response.status, errorText);
            console.error('Mailchimp request URL:', `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members/${subscriberHash}`);
            console.error('Subscriber data sent:', JSON.stringify(subscriberData, null, 2));
            throw new Error(`Mailchimp error: ${response.statusText} - ${errorText}`);
        }

        console.log('Mailchimp subscriber added/updated:', email);
        console.log('Merge fields sent:', JSON.stringify(subscriberData.merge_fields, null, 2));

        // Add tags to subscriber
        if (tags.length > 0) {
            const tagResponse = await fetch(
                `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.MAILCHIMP_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tags: tags.map(name => ({ name, status: 'active' }))
                    })
                }
            );

            if (!tagResponse.ok) {
                const tagErrorText = await tagResponse.text();
                console.error('Mailchimp tag error:', tagResponse.status, tagErrorText);
            } else {
                console.log('Mailchimp tags added:', tags);
            }
        }

        // Trigger automation (your Mailchimp automation should send the bonus guides)
        // This is done via tags - setup your automation in Mailchimp to trigger on these tags

    } catch (error) {
        console.error('Mailchimp error:', error);
        // Don't fail if Mailchimp fails, log for manual follow-up
    }
}

// ===== ADD LEAD TO MAILCHIMP =====
async function addLeadToMailchimp(email, name, leadTag, env) {
    // Skip if Mailchimp is not configured
    if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_SERVER_PREFIX || !env.MAILCHIMP_LIST_ID) {
        console.log('Mailchimp not configured, skipping lead addition');
        return;
    }

    try {
        const subscriberHash = generateMD5Hash(email.toLowerCase());

        const mergeFields = {
            FNAME: name?.split(' ')[0] || '',
            LNAME: name?.split(' ').slice(1).join(' ') || ''
        };

        const subscriberData = {
            email_address: email,
            status_if_new: 'subscribed',
            merge_fields: mergeFields
        };

        console.log('Adding lead to Mailchimp:', JSON.stringify(subscriberData, null, 2));

        // Add/update subscriber
        const response = await fetch(
            `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${env.MAILCHIMP_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriberData)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mailchimp API error:', response.status, errorText);
            throw new Error(`Mailchimp error: ${response.statusText}`);
        }

        console.log('Mailchimp lead added/updated:', email);

        // Add tag if provided
        if (leadTag) {
            const tagResponse = await fetch(
                `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.MAILCHIMP_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tags: [{ name: leadTag, status: 'active' }]
                    })
                }
            );

            if (!tagResponse.ok) {
                const tagErrorText = await tagResponse.text();
                console.error('Mailchimp tag error:', tagResponse.status, tagErrorText);
            } else {
                console.log('Mailchimp tag added:', leadTag);
            }
        }

    } catch (error) {
        console.error('Mailchimp lead error:', error);
        // Don't fail if Mailchimp fails
    }
}

// ===== HELPER FUNCTIONS =====

// Generate MD5 hash for Mailchimp subscriber hash
function generateMD5Hash(text) {
    // Simple MD5 implementation for Cloudflare Workers
    // Based on the RSA Data Security, Inc. MD5 Message-Digest Algorithm
    function md5cycle(x, k) {
        let a = x[0], b = x[1], c = x[2], d = x[3];
        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);
        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);
        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    }

    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }

    function md5blk(s) {
        const md5blks = [];
        for (let i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    function rhex(n) {
        let s = '', j = 0;
        for (; j < 4; j++)
            s += '0123456789abcdef'.charAt((n >> (j * 8 + 4)) & 0x0F) + '0123456789abcdef'.charAt((n >> (j * 8)) & 0x0F);
        return s;
    }

    function md51(s) {
        const n = s.length;
        const state = [1732584193, -271733879, -1732584194, 271733878];
        let i;
        for (i = 64; i <= s.length; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < s.length; i++)
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i++) tail[i] = 0;
        }
        tail[14] = n * 8;
        md5cycle(state, tail);
        return state;
    }

    const hex_chr = '0123456789abcdef'.split('');
    const state = md51(text);
    let ret = '';
    for (let i = 0; i < 4; i++) {
        ret += rhex(state[i]);
    }
    return ret;
}

// Generate order confirmation email content
function generateOrderConfirmation(session, cart) {
    const itemsList = cart.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f7fafc; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #e63946; color: white; }
                .bonus-box { background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .cta-button { background: #e63946; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; display: inline-block; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Order Confirmed!</h1>
                    <p>Thank you for your purchase</p>
                </div>
                <div class="content">
                    <h2>Order #${session.id}</h2>
                    <p>Hi ${session.customer_details?.name},</p>
                    <p>Your order has been confirmed and is being prepared for shipment.</p>
                    
                    <h3>Order Details:</h3>
                    <table>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                        </tr>
                        ${itemsList}
                    </table>
                    
                    <div class="bonus-box">
                        <h3>🎁 Your FREE Bonuses</h3>
                        <p><strong>Check your email!</strong> You'll receive instant access to:</p>
                        <ul>
                            <li>30-Day Unshakable Action Guide</li>
                            <li>10-Day Family Prayer Guide</li>
                        </ul>
                        <p><em>Look for an email from us with download links.</em></p>
                    </div>
                    
                    <p>You'll receive a shipping confirmation email with tracking information once your order ships (typically within 1-2 business days).</p>
                    
                    <p>Questions? Contact us at support@bridgebuilders.net</p>
                    
                    <p>Blessings,<br>The BridgeBuilders Team</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/* 
SETUP INSTRUCTIONS:

1. CREATE STRIPE PRICE IDs:
   - Go to Stripe Dashboard > Products
   - Create a Price for each product
   - Update the PRICE_IDS object above with real Price IDs (price_xxx format)

2. DEPLOY TO CLOUDFLARE:
   - Install Wrangler CLI: npm install -g wrangler
   - Login: wrangler login
   - Create worker: wrangler init unshakable-store
   - Copy this code to src/index.js
   - Deploy: wrangler deploy

3. SET ENVIRONMENT VARIABLES:
   - In Cloudflare Dashboard > Workers > Your Worker > Settings > Variables
   - Add all the secret keys as encrypted variables

4. CONFIGURE WEBHOOKS:
   - Stripe: Dashboard > Developers > Webhooks
   - Add endpoint: https://your-worker.workers.dev/api/webhook
   - Select events: checkout.session.completed
   - Copy webhook secret and add to env variables

5. MAILCHIMP SETUP:
   - Create automation that triggers on tags:
     * "30-Day-Unshakable-Guide" → Send Unshakable bonus
     * "10-Day-Prayer-Guide" → Send Fire bonus
     * "Purchased-Customer" → Add to customer segment

6. SHIPSTATION SETUP:
   - Get API credentials from ShipStation
   - Configure store settings
   - Set up product mappings using the product IDs

7. UPDATE FRONTEND:
   - Replace all instances of YOUR_DOMAIN with actual domain
   - Update API endpoint URLs to point to your Worker
   - Test with Stripe test mode first

8. TESTING:
   - Use Stripe test cards: 4242 4242 4242 4242
   - Check Stripe Dashboard for test payments
   - Verify webhook events are received
   - Confirm Mailchimp automation triggers
   - Test ShipStation order creation
*/
