/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { SearchService } from '@/core/SearchService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
    tags: ['pages'],
    requireCredential: false,
    res: {
        type: 'array',
        optional: false, nullable: false,
        items: {
            type: 'object',
            optional: false, nullable: false,
            ref: 'Page',
        },
    },
    errors: {
        unavailable: {
            message: 'Search of pages unavailable.',
            code: 'UNAVAILABLE',
            id: '0b44998d-77aa-4427-80d0-d2c9b8523012',  // New unique ID for pages
        },
    },
    // 2 calls per second
    limit: {
        duration: 1000,
        max: 2,
    },
} as const;

export const paramDef = {
    type: 'object',
    properties: {
        query: { type: 'string' },
        sinceId: { type: 'string', format: 'misskey:id' },
        untilId: { type: 'string', format: 'misskey:id' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        offset: { type: 'integer', default: 0 },
        host: {
            type: 'string',
            description: 'The local host is represented with `.`.',
        },
        userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
        order: { type: 'string' },
    },
    required: ['query'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
    constructor(
        private pageEntityService: PageEntityService,
        private searchService: SearchService,
        private roleService: RoleService,
    ) {
        super(meta, paramDef, async (ps, me) => {
            const pages = await this.searchService.searchPage(ps.query, me, {
                userId: ps.userId,
                host: ps.host,
                order: ps.order,
            }, {
                untilId: ps.untilId,
                sinceId: ps.sinceId,
                limit: ps.limit,
            });

            return await this.pageEntityService.packMany(pages, me);
        });
    }
}