import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { hash, genSalt, compare } from 'bcrypt';
import { randomBytes } from 'crypto';
@Injectable()
export class UtilService {
  constructor() {}
  async hashPassword(pwd: string) {
    const salt = await genSalt();
    return hash(pwd, salt);
  }
  comparePassword(pwd: string, hashedPwd: string) {
    return compare(pwd, hashedPwd);
  }
  formatPrice(price: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }
  generateUniqueCode(prefix: string = 'ed', len = 4) {
    const randomString = randomBytes(len).toString('hex').toUpperCase();
    return `${prefix}${randomString}`;
  }

  generateStrongPassword(length: number = 8): string {
    const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';
    let password = [
      upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)],
      lowerCaseChars[Math.floor(Math.random() * lowerCaseChars.length)],
      numberChars[Math.floor(Math.random() * numberChars.length)],
      specialChars[Math.floor(Math.random() * specialChars.length)],
    ];
    const allChars =
      upperCaseChars + lowerCaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
      password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    password = password.sort(() => Math.random() - 0.5);

    return password.join('');
  }

  handleError(error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(
      error.message || 'Internal Server Error',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
