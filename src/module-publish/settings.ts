import config from "../config";
import type { AxiosInstance, AxiosResponse } from "axios";

type Api = AxiosInstance;

export async function collectionExists(api: Api): Promise<boolean> {
	try {
		const res: AxiosResponse = await api.get(
			`/collections/${config.collection.collection}`
		);
		return !!(res.data && res.data.data);
	} catch (err) {
		console.error(err);
		return false;
	}
}

export async function createCollection(api: Api): Promise<boolean> {
	try {
		const res: AxiosResponse = await api.post(
			"/collections",
			config.collection
		);
		if (res?.status === 200) {
			const requests = config.fields.map((f) =>
				api.post(`/fields/${config.collection.collection}`, f)
			);
			const responses = await Promise.all(requests);
			return responses.every((r) => r.status === 200);
		}
		return false;
	} catch (err) {
		console.error(err);
		return false;
	}
}

export async function getSites(api: Api): Promise<Record<string, any>[]> {
	try {
		const res: AxiosResponse = await api.get(
			`/items/${config.collection.collection}`
		);
		if (res?.data?.data) {
			const so: Record<string, any> = {};
			for (const s of res.data.data) {
				const k = "site_" + s.site;
				const o = so[k] ?? {};
				o[s.key] =
					s.key === config.keys.env ? JSON.parse(s.value) : s.value;
				so[k] = o;
			}
			return Object.values(so);
		}
		return [];
	} catch (err) {
		console.error(err);
		return [];
	}
}

export async function saveSite(
	api: Api,
	name: string,
	path: string,
	command: string,
	url: string,
	env: Record<string, any>
): Promise<boolean> {
	const siteId = await _getNewSiteId(api);
	if (!siteId) return false;

	const properties = [
		{ site: siteId, key: config.keys.id, value: siteId },
		{ site: siteId, key: config.keys.name, value: name },
		{ site: siteId, key: config.keys.path, value: path },
		{ site: siteId, key: config.keys.command, value: command },
		{ site: siteId, key: config.keys.url, value: url },
		{
			site: siteId,
			key: config.keys.env,
			value: JSON.stringify(env ?? {}),
		},
		{ site: siteId, key: config.keys.status, value: config.statuses.created },
		{ site: siteId, key: config.keys.log, value: undefined },
		{ site: siteId, key: config.keys.timestamp, value: Date.now() },
		{ site: siteId, key: config.keys.activity, value: 0 },
	];

	try {
		const res: AxiosResponse = await api.post(
			`/items/${config.collection.collection}`,
			properties
		);
		return res?.status === 200;
	} catch (err) {
		console.error(err);
		return false;
	}
}

export async function removeSite(api: Api, site: number): Promise<boolean> {
	try {
		const res: AxiosResponse = await api.get(
			`/items/${config.collection.collection}?filter={"site":{"_eq":${site}}}`
		);
		if (res?.data?.data?.length > 0) {
			const ids = res.data.data.map((row: any) => row.id);
			const delRes: AxiosResponse = await api.delete(
				`/items/${config.collection.collection}`,
				{ data: { keys: ids } }
			);
			return delRes?.status === 204;
		}
		return false;
	} catch (err) {
		console.error(err);
		return false;
	}
}

export async function buildSite(
	api: Api,
	site: number
): Promise<Record<string, any>> {
	const res: AxiosResponse = await api.get(
		`/${config.extension}/build/${site}`
	);
	return (
		res?.data ?? {
			error:
				"Server error - API endpoint did not return known response",
		}
	);
}

export async function getSiteStatus(
	api: Api,
	site: number
): Promise<Record<string, any>> {
	const res: AxiosResponse = await api.get(
		`/${config.extension}/status/${site}`
	);
	return (
		res?.data ?? {
			error:
				"Server error - API endpoint did not return known response",
		}
	);
}

export async function getLastActivityId(api: Api): Promise<number> {
	try {
		const filter = JSON.stringify(config.activityFilter);
		const res: AxiosResponse = await api.get(
			`/activity?filter=${filter}&sort=-timestamp&limit=1`
		);
		return res?.data?.data?.[0]?.id ?? 0;
	} catch (err) {
		console.error(err);
		return 0;
	}
}

async function _getNewSiteId(api: Api): Promise<number | undefined> {
	try {
		const res: AxiosResponse = await api.get(
			`/items/${config.collection.collection}?sort=-site&limit=1`
		);
		if (res?.data?.data?.length > 0) {
			return res.data.data[0].site + 1;
		}
		return 1;
	} catch (err) {
		console.error(err);
		return;
	}
}
