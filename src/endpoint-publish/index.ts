import { defineEndpoint } from '@directus/extensions-sdk';
import type { Accountability, SchemaOverview } from '@directus/types';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import config from '../config';

interface Site {
	id: string | number;
	[key: string]: any;
}

export default defineEndpoint((router, { services }) => {
	const { ActivityService, ItemsService } = services;

	/**
	 * Build the specified Site
	 */
	router.get('/build/:site', _checkAuth, async (req, res) => {
		const activityService = new ActivityService({
			schema: req.schema as SchemaOverview,
			accountability: req.accountability as Accountability,
		});
		const settingsService = new ItemsService(config.collection.collection, {
			schema: req.schema as SchemaOverview,
			accountability: req.accountability as Accountability,
		});

		// Lookup Site Info from DB
		const site = await _getSiteInfo(settingsService, req.params.site as string);
		if (!site) {
			res.send({ error: 'Site configuration not found in Settings' });
			return;
		}

		// Make Temp File for Log
		const logFile = await _makeLogFile(settingsService, site);
		if (!logFile) {
			res.send({ error: 'Could not create log file' });
			return;
		}

		// Update Status
		const startUpdateSuccess = await _updateStatus(settingsService, site, config.statuses.started);
		if (!startUpdateSuccess) {
			res.send({ error: 'Could not update Site status to Building in Settings' });
			return;
		}

		// Set command
		let sitePath = site[config.keys.path];
		let command = site[config.keys.command];
		let env = site[config.keys.env];
		let envString = '';
		if (env) {
			try {
				env = JSON.parse(env);
				for (const key in env) {
					if (Object.prototype.hasOwnProperty.call(env, key)) {
						envString += `${key}=${env[key]} `;
					}
				}
			} catch (err) {
				console.log('ERROR: Could not parse env string into object');
				console.log(err);
			}
		}
		const cmd = `${envString}npm --no-color run --prefix "${sitePath}" "${command}"`;

		// Run Build Command
		const logStream = fs.createWriteStream(logFile);
		const child = exec(cmd);
		if (child.stdout) child.stdout.pipe(logStream);
		if (child.stderr) child.stderr.pipe(logStream);

		child.on('exit', async (code) => {
			if (code === 0) {
				const finishUpdateSuccess = await _updateStatus(settingsService, site, config.statuses.completed);
				if (!finishUpdateSuccess) {
					return res.send({ error: 'Could not update Site status to Published in Settings' });
				}
				const activityUpdateSuccess = await _updateActivity(activityService, settingsService, site);
				if (!activityUpdateSuccess) {
					return res.send({ error: 'Could not update Site activity in Settings' });
				}
				return res.send({ success: 'Site successfully published' });
			} else {
				const finishUpdateSuccess = await _updateStatus(settingsService, site, config.statuses.failed);
				if (!finishUpdateSuccess) {
					return res.send({ error: 'Could not update Site status to Build Failed in Settings' });
				}
				return res.send({ error: 'The Build process failed - view log for details' });
			}
		});
	});

	/**
	 * Get the status, timestamp, and log contents of the specified Site
	 */
	router.get('/status/:site', _checkAuth, async (req, res) => {
		const settingsService = new ItemsService(config.collection.collection, {
			schema: req.schema as SchemaOverview,
			accountability: req.accountability as Accountability,
		});

		const site = await _getSiteInfo(settingsService, req.params.site as string);
		if (!site) {
			res.send({ error: 'Site configuration not found in Settings' });
			return;
		}

		let logContents: string | undefined;
		try {
			logContents = fs.readFileSync(site[config.keys.log], 'utf8');
		} catch (err) {
			console.error(err);
			res.send({
				status: site[config.keys.status],
				timestamp: site[config.keys.timestamp],
				log: undefined,
				error: 'Could not read log file'
			});
			return;
		}

		res.send({
			status: site[config.keys.status],
			timestamp: site[config.keys.timestamp],
			log: logContents,
		});
	});

	/**
	 * Check auth
	 */
	function _checkAuth(req: any, res: any, next: any) {
		if (req.accountability?.admin) {
			next();
		} else {
			res.send({ error: 'You must be logged in with admin privileges' });
		}
	}

	/**
	 * Lookup Site info
	 */
	async function _getSiteInfo(settingsService: any, siteId: string): Promise<Site | undefined> {
		try {
			const rows = await settingsService.readByQuery({
				filter: { site: { _eq: siteId } },
				fields: ['key', 'value'],
			});
			const site: any = {};
			for (const row of rows) {
				site[row.key] = row.value;
			}
			return rows.length > 0 ? site : undefined;
		} catch (err) {
			console.log(err);
			return;
		}
	}

	/**
	 * Update status
	 */
	async function _updateStatus(settingsService: any, site: Site, status: string): Promise<boolean> {
		try {
			const statusUpdate = await settingsService.updateByQuery(
				{ filter: { site: { _eq: site[config.keys.id] }, key: { _eq: config.keys.status } } },
				{ value: status }
			);
			const timestampUpdate = await settingsService.updateByQuery(
				{ filter: { site: { _eq: site[config.keys.id] }, key: { _eq: config.keys.timestamp } } },
				{ value: new Date().getTime() }
			);
			return (
				statusUpdate && statusUpdate.length === 1 && timestampUpdate && timestampUpdate.length === 1
			);
		} catch (err) {
			console.log(err);
			return false;
		}
	}

	/**
	 * Update activity
	 */
	async function _updateActivity(
		activityService: any,
		settingsService: any,
		site: Site
	): Promise<boolean> {
		try {
			const activityRows = await activityService.readByQuery({
				filter: config.activityFilter,
				sort: ['-timestamp'],
				limit: 1,
			});
			if (!activityRows || activityRows.length !== 1) {
				return false;
			}
			const activityId = activityRows[0].id;

			const activityUpdate = await settingsService.updateByQuery(
				{ filter: { site: { _eq: site[config.keys.id] }, key: { _eq: config.keys.activity } } },
				{ value: activityId }
			);
			return activityUpdate && activityUpdate.length === 1;
		} catch (err) {
			console.log(err);
			return false;
		}
	}

	/**
	 * Make log file
	 */
	async function _makeLogFile(settingsService: any, site: Site): Promise<string | undefined> {
		try {
			const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), config.extension + '-'));
			const logFile = path.join(tmpDir, 'site-' + site[config.keys.id] + '.log');
			const logUpdate = await settingsService.updateByQuery(
				{ filter: { site: { _eq: site[config.keys.id] }, key: { _eq: config.keys.log } } },
				{ value: logFile }
			);
			return logUpdate && logUpdate.length === 1 ? logFile : undefined;
		} catch (err) {
			console.log(err);
			return;
		}
	}
});
