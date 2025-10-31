import { Injectable } from '@nestjs/common';
import { Model, Document, FilterQuery } from 'mongoose';
import { PaginationMeta } from '../types';

@Injectable()
export class PaginationService {
  async paginate<T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    page: number = 1,
    perPage: number = 10,
    populate?: any,
    is_export?: boolean,
  ): Promise<{ items: T[]; meta: PaginationMeta }> {
    if (is_export) {
      const items = await model
        .find(query)
        .sort({ created_at: -1 })
        .populate(populate)
        .exec();
      const meta: PaginationMeta = {
        total: items.length,
        page: 1,
        page_size: items.length,
        total_pages: 1,
      };

      return { items, meta };
    }

    page = Math.max(page, 1);
    perPage = Math.max(perPage, 1);
    const total = await model.countDocuments(query).exec();
    const totalPages = Math.ceil(total / perPage);
    const items = await model
      .find(query)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ created_at: -1 })
      .populate(populate)
      .exec();

    const meta: PaginationMeta = {
      total,
      page,
      page_size: perPage,
      total_pages: totalPages,
    };

    return { items, meta };
  }
}
