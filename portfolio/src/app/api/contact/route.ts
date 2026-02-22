import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 30 * 1000; // 30 seconds
const MAX_REQUESTS = 1;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS - record.count, resetTime: record.resetTime };
}

// AI-powered message summarization
function generateSummary(message: string): string {
  const lowerMsg = message.toLowerCase();

  // Detect intent patterns
  if (lowerMsg.includes('job') || lowerMsg.includes('hire') || lowerMsg.includes('position') || lowerMsg.includes('role')) {
    return 'a job opportunity';
  }
  if (lowerMsg.includes('project') || lowerMsg.includes('collaborat') || lowerMsg.includes('work together')) {
    return 'a potential collaboration';
  }
  if (lowerMsg.includes('freelance') || lowerMsg.includes('contract') || lowerMsg.includes('consult')) {
    return 'freelance work';
  }
  if (lowerMsg.includes('question') || lowerMsg.includes('help') || lowerMsg.includes('how to')) {
    return 'a question';
  }
  if (lowerMsg.includes('meet') || lowerMsg.includes('coffee') || lowerMsg.includes('call') || lowerMsg.includes('chat')) {
    return 'meeting up';
  }
  if (lowerMsg.includes('portfolio') || lowerMsg.includes('website') || lowerMsg.includes('site')) {
    return 'feedback on the portfolio';
  }
  if (lowerMsg.includes('connect') || lowerMsg.includes('network') || lowerMsg.includes('linkedin')) {
    return 'connecting';
  }
  if (lowerMsg.includes('app') || lowerMsg.includes('saas') || lowerMsg.includes('product') || lowerMsg.includes('startup')) {
    return 'a SaaS/product idea';
  }
  if (lowerMsg.includes('bug') || lowerMsg.includes('issue') || lowerMsg.includes('error') || lowerMsg.includes('broken')) {
    return 'reporting an issue';
  }

  // Default summary based on message length
  if (message.length < 30) {
    return 'getting in touch';
  }

  return 'reaching out';
}

function generateAIResponse(summary: string): string {
  const responses = [
    `Sounds good — I'll get back to you about ${summary}.`,
    `Got it. I'll follow up on ${summary} soon.`,
    `Thanks for reaching out about ${summary}. Talk soon.`,
    `Noted. I'll reply about ${summary} shortly.`,
    `Appreciate the message about ${summary}. I'll be in touch.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Please wait ${retryAfter} seconds before sending another message.`,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { message, timestamp, senderEmail } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Check for common spam patterns
    const spamPatterns = [
      /\b(viagra|cialis|casino|lottery|winner|prize|million dollars)\b/gi,
      /https?:\/\/\S{100,}/g,
      /(.+)\1{10,}/g,
    ];

    const isSpam = spamPatterns.some(pattern => pattern.test(message));

    if (isSpam) {
      return NextResponse.json(
        { error: 'Message flagged as potential spam' },
        { status: 400 }
      );
    }

    // Generate AI summary and response
    const summary = generateSummary(message);
    const aiResponse = generateAIResponse(summary);

    // Get additional info
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';

    // Prepare email content
    const emailSubject = `New message from your portfolio - ${new Date().toLocaleDateString()}`;
    const emailBody = `
New message from your iMessage portfolio:

Original Message:
${message}

${senderEmail ? `Sender Email: ${senderEmail}` : 'Sender Email: Not provided'}

AI Summary: ${summary}
AI Response: ${aiResponse}

---
Sent: ${timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}
IP: ${clientIP}
User Agent: ${userAgent}
Referer: ${referer}
    `.trim();

    // Send email (if SMTP is configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.RECIPIENT_EMAIL || process.env.SMTP_USER,
        ...(senderEmail ? { replyTo: senderEmail } : {}),
        subject: emailSubject,
        text: emailBody,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007AFF;">New Portfolio Message</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            ${senderEmail ? `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0;"><strong>Sender Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
            </div>
            ` : ''}
            <div style="background: #e8f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>AI Summary:</strong> ${summary}</p>
              <p style="margin: 5px 0;"><strong>AI Response:</strong> ${aiResponse}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              <strong>Sent:</strong> ${timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}<br>
              <strong>IP:</strong> ${clientIP}<br>
              <strong>User Agent:</strong> ${userAgent}<br>
              <strong>Referer:</strong> ${referer}
            </p>
          </div>
        `,
      });
    } else {
      console.log('=== PORTFOLIO MESSAGE ===');
      console.log(emailBody);
      console.log('========================');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        aiResponse: {
          summary,
          response: aiResponse,
        },
        rateLimit: {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        }
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
        }
      }
    );

  } catch (error) {
    console.error('Error processing contact form:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
