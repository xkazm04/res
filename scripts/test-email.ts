/**
 * Test script to validate Resend email credentials
 * Run with: npx tsx scripts/test-email.ts
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    console.error('RESEND_API_KEY not found in .env');
    process.exit(1);
  }

  if (!fromEmail) {
    console.error('RESEND_FROM_EMAIL not found in .env');
    process.exit(1);
  }

  console.log('Resend credentials found:');
  console.log(`  API Key: ${apiKey.slice(0, 10)}...`);
  console.log(`  From Email: ${fromEmail}`);
  console.log('');

  const resend = new Resend(apiKey);

  console.log('Sending test email to kazdan@seznam.cz...');

  try {
    // Note: Using Resend's test domain for validation
    // Custom domains need to be verified at https://resend.com/domains
    const actualFrom = fromEmail.includes('noreply.com')
      ? 'Research Test <onboarding@resend.dev>'
      : fromEmail;

    console.log(`  Using from: ${actualFrom}`);
    console.log('');

    // With test domain, can only send to account owner email
    // For other recipients, need verified domain
    const testRecipient = actualFrom.includes('resend.dev')
      ? 'kazdanm@gmail.com'
      : 'kazdan@seznam.cz';

    console.log(`  Sending to: ${testRecipient}`);
    console.log('');

    const { data, error } = await resend.emails.send({
      from: actualFrom,
      to: testRecipient,
      subject: 'Hello World - Resend Test',
      html: `
        <h1>Hello World!</h1>
        <p>This is a test email from the Deep Research Actor.</p>
        <p>If you received this, your Resend credentials are working correctly.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}
        </p>
      `,
      text: `Hello World!\n\nThis is a test email from the Deep Research Actor.\n\nIf you received this, your Resend credentials are working correctly.\n\nSent at: ${new Date().toISOString()}`,
    });

    if (error) {
      console.error('Failed to send email:', error);
      process.exit(1);
    }

    console.log('Email sent successfully!');
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testEmail();
