/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, MiMeta } from '@/models/_.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
import { UtilityService } from '@/core/UtilityService.js';

export const meta = {
	tags: ['pages', 'hashtags'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			// Reference to the Page schema (make sure it's defined)
			ref: 'Page',
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
		// Although the original parameters (reply, renote, withFiles, poll)
		// were for notes, we assume that for pages only tag or query searches apply.
		// You may remove the note-specific parameters if they are not needed.
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		// Page-based pagination parameter.
		page: { type: 'integer', minimum: 1, default: 1 },
		tag: { type: 'string', minLength: 1 },
		query: {
			type: 'array',
			description: 'The outer arrays are chained with OR, the inner arrays are chained with AND.',
			items: {
				type: 'array',
				items: {
					type: 'string',
					minLength: 1,
				},
				minItems: 1,
			},
			minItems: 1,
		},
	},
	anyOf: [
		{ required: ['tag'] },
		{ required: ['query'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		// Inject the pages repository instead of the notes repository.
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		// Use a page entity service rather than a note entity service.
		private pageEntityService: PageEntityService,
		private queryService: QueryService,
		private cacheService: CacheService,
		private utilityService: UtilityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Build the base query against the pages table.
			let query = this.queryService
				.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId)
				.andWhere('page.visibility = \'public\'')
				.innerJoinAndSelect('page.user', 'user');

			// If bot trending is disabled, filter out pages by bot users.
			if (!this.serverSettings.enableBotTrending) {
				query.andWhere('user.isBot = FALSE');
			}

			// Build a search filter based on tag or query.
			try {
				if (ps.tag) {
					if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
					query.andWhere(':tag <@ page.tags', { tag: [normalizeForSearch(ps.tag)] });
				} else {
					query.andWhere(new Brackets(qb => {
						for (const tags of ps.query!) {
							qb.orWhere(new Brackets(qb => {
								for (const tag of tags) {
									if (!safeForSql(normalizeForSearch(tag))) throw new Error('Injection');
									qb.andWhere(':tag <@ page.tags', { tag: [normalizeForSearch(tag)] });
								}
							}));
						}
					}));
				}
			} catch (e) {
				if (e === 'Injection') return [];
				throw e;
			}

			// If neither cursor-based pagination (sinceId/untilId) is used,
			// apply page-based pagination.
			if (!ps.sinceId && !ps.untilId) {
				const offset = (ps.page - 1) * ps.limit;
				query.skip(offset);
			}

			// Limit the number of results.
			let pages = await query.limit(ps.limit).getMany();

			return await this.pageEntityService.packMany(pages, me);
		});
	}
}
