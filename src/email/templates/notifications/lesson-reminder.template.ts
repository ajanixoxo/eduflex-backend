import { EmailParams } from 'src/email/types';
import { EMAIL_FOOTER, EMAIL_HEAD, EMAIL_REGARDS } from '../components';
import { EMAIL_BRAND } from '../components/brand';
import { SUPPORT_EMAIL } from 'src/email/constants';

export const LessonReminderTemplate = ({ user, params }: EmailParams) => {
  const { courseTitle, lessonTime, courseUrl, unsubscribeUrl } = params;

  return `
    <mjml>
      //   ${EMAIL_HEAD}
      <mj-body background-color="#f3f3f3">
        ${EMAIL_BRAND}
        <mj-section background-color="#ffffff" border-radius="16px">
          <mj-column>
            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300" text-transform="capitalize">
              Hello ${user.firstname},
            </mj-text>

            <mj-text font-size="20px" line-height="1.6" color="#6346FA" font-family="Poppins, Arial" font-weight="600" align="center">
              Your lesson starts in 30 minutes!
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              Get ready for your upcoming lesson in <strong>${courseTitle}</strong>.
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300" align="center">
              <span style="display:inline-block; padding:12px 24px; background:#EEE7F7; border-radius:8px; font-weight:600; color:#6346FA;">
                Scheduled Time: ${lessonTime}
              </span>
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              Take a moment to prepare yourself, grab a drink, and find a comfortable spot to focus on your learning.
            </mj-text>

            <mj-button background-color="#6346FA" color="white" font-family="Poppins, Arial" font-size="16px" font-weight="600" border-radius="8px" href="${courseUrl}">
              Go to Course
            </mj-button>

            <mj-text font-size="14px" line-height="1.6" color="#666666" font-family="Poppins, Arial" font-weight="300">
              If you have any questions or require assistance, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6346FA">${SUPPORT_EMAIL}</a>.
            </mj-text>

            ${EMAIL_REGARDS}

            <mj-divider border-color="#E5E5E5" border-width="1px" />

            <mj-text font-size="12px" line-height="1.6" color="#999999" font-family="Poppins, Arial" font-weight="300" align="center">
              Don't want to receive lesson reminders? <a href="${unsubscribeUrl}" style="color:#6346FA">Update your notification preferences</a>
            </mj-text>
          </mj-column>
        </mj-section>
        ${EMAIL_FOOTER}
      </mj-body>
    </mjml>
    `;
};
