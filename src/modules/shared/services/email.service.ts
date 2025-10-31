import { createObjectCsvStringifier } from 'csv-writer';
import mjml2html = require('mjml');
const formData = require('form-data');
import Mailgun from 'mailgun.js';
import { Env } from '../constants';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { EmailPrep } from 'src/email/types';
const mailgun = new Mailgun(formData);
@Injectable()
export class EmailService {
  private readonly mailgunSender;
  constructor(private readonly appConfigService: AppConfigService) {
    this.mailgunSender = mailgun.client({
      username: 'api',
      key: Env.MAILGUN_API_KEY,
    });
  }

  async sendEmailNotification({ email, body, subject }: EmailPrep) {
    const emailOutput = mjml2html(body, {});
    try {
      await this.mailgunSender.messages.create(Env.MAILGUN_DOMAIN, {
        from: 'Eduflex AI <noreply@ogurinkabenjamin.com>',
        to: [email],
        subject,
        html: emailOutput.html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  getExportedContent(docs: any[], headers: { id: string; title: string }[]) {
    const csvStringifier = createObjectCsvStringifier({
      header: headers,
    });

    const headerStr = headers.map((h) => h.title).join(',') + '\n';
    const data = headerStr + csvStringifier.stringifyRecords(docs);
    return Buffer.from(data).toString('base64');
  }
}
