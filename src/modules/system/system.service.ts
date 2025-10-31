import { Injectable } from '@nestjs/common';
import { IApiResponseDto, ICountry } from '../shared/types';
import { countries } from '../shared/constants';

@Injectable()
export class SystemService {
  async getCountryList(): Promise<IApiResponseDto> {
    const list = countries.filter((d) => d.is_supported);
    return {
      message: 'Countries retrieved',
      data: list,
    };
  }
  getCountry(country_code: string): ICountry | null {
    const country = countries.find((d) => d.code === country_code);
    return country || null;
  }
}
