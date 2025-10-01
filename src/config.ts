const extension_name = "melvishniz-publish-node";
const collection_name = "melvishniz_publish_node";

export const config = {
	extension: extension_name,
	collection: {
		collection: collection_name,
		meta: {
			collection: collection_name,
			icon: "cloud_upload",
			note: `Configuration settings for the ${extension_name} extension`,
			hidden: true,
		},
		schema: {},
	},
	fields: [
		{
			field: "site",
			type: "integer",
		},
		{
			field: "key",
			type: "string",
		},
		{
			field: "value",
			type: "string",
		},
	],
	keys: {
		id: "site-id",
		name: "site-name",
		path: "site-path",
		command: "site-command",
		url: "site-url",
		env: "site-env",
		status: "build-status",
		log: "build-log",
		timestamp: "build-timestamp",
		activity: "build-activity",
	} as const,
	statuses: {
		created: "Created - Not Published",
		started: "Building...",
		failed: "Build Failed - See Log for details",
		completed: "Published",
	} as const,
	activityFilter: {
		action: {
			_neq: "login",
		},
		collection: {
			_nin: [
				collection_name,
				"directus_dashboards",
				"directus_folders",
				"directus_migrations",
				"directus_panels",
				"directus_sessions",
				"directus_settings",
				"directus_webhooks",
			],
		},
	},
	allow_concurrent_builds: false,
	extension_path_env_var: "DIRECTUS_EXTENSIONS_PATH",
};

export type Config = typeof config;
export default config;
