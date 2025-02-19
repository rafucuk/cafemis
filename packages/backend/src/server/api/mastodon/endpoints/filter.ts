/*
 * SPDX-FileCopyrightText: marie and other Cafemis contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { convertFilter } from '../converters.js';
import type { MegalodonInterface } from 'megalodon';
import type { FastifyRequest } from 'fastify';

export class ApiFilterMastodon {
	private request: FastifyRequest;
	private client: MegalodonInterface;

	constructor(request: FastifyRequest, client: MegalodonInterface) {
		this.request = request;
		this.client = client;
	}

	public async getFilters() {
		try {
			const data = await this.client.getFilters();
			return data.data.map((filter) => convertFilter(filter));
		} catch (e: any) {
			console.error(e);
			return e.response.data;
		}
	}

	public async getFilter() {
		try {
			const data = await this.client.getFilter( (this.request.params as any).id );
			return convertFilter(data.data);
		} catch (e: any) {
			console.error(e);
			return e.response.data;
		}
	}

	public async createFilter() {
		try {
			const body: any = this.request.body;
			const data = await this.client.createFilter(body.pharse, body.context, body);
			return convertFilter(data.data);
		} catch (e: any) {
			console.error(e);
			return e.response.data;
		}
	}

	public async updateFilter() {
		try {
			const body: any = this.request.body;
			const data = await this.client.updateFilter((this.request.params as any).id, body.pharse, body.context);
			return convertFilter(data.data);
		} catch (e: any) {
			console.error(e);
			return e.response.data;
		}
	}

	public async rmFilter() {
		try {
			const data = await this.client.deleteFilter( (this.request.params as any).id );
			return data.data;
		} catch (e: any) {
			console.error(e);
			return e.response.data;
		}
	}
}
