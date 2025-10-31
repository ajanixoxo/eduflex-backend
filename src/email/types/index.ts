import { User, UserDocument } from 'src/modules/user/schemas';

export type EmailPrep = {
  email: string;
  subject: string;
  body: string;
};
export interface EmailParams {
  user: UserDocument | User;
  params?: any;
}
