<template>
	<div>
		<!-- List of Site Cards -->
		<v-card
			v-for="site in sites"
			:key="site[config.keys.id]"
			class="site-card"
			v-if="lastActivityId"
		>
			<!-- Update Status -->
			<div
				v-if="build && !siteIsBuilding(site) && lastActivityId && siteUpdateAvailable(site)"
				class="site-card-update site-card-update-available"
			>
				<p><v-icon name="update" /> Updates Available</p>
			</div>
			<div
				v-else-if="build && !siteIsBuilding(site) && lastActivityId"
				class="site-card-update site-card-update-none"
			>
				<p><v-icon name="check_circle" /> Site Updated</p>
			</div>
			<div v-if="build && siteIsBuilding(site)" class="site-card-update site-card-update-building">
				<p><v-icon name="build" /> Building <v-progress-circular indeterminate /></p>
			</div>

			<!-- Site Info -->
			<v-card-title>
				{{ site[config.keys.name] }}
				<span v-if="settings" class="id-badge">#{{ site[config.keys.id] }}</span>
			</v-card-title>
			<v-card-subtitle>{{ site[config.keys.url] }}</v-card-subtitle>

			<v-card-text>
				<p v-if="settings">
					<strong>Path:</strong>
					<code>{{ site[config.keys.path] }}</code>
				</p>
				<p v-if="settings">
					<strong>Build Command:</strong>
					<code>npm run {{ site[config.keys.command] }}</code>
				</p>
				<p v-if="settings">
					<strong>Environment Variables:</strong>
					<ul v-for="(value, key) in site[config.keys.env]" :key="key" class="envvar-list">
						<li>{{ key }}={{ value }}</li>
					</ul>
				</p>
				<p>
					<strong>Status:</strong>
					{{ site[config.keys.status] || "Unknown" }}
				</p>
				<p>
					<strong>Last Updated:</strong>
					{{ site[config.keys.timestamp]
						? new Date(parseInt(site[config.keys.timestamp])).toLocaleString()
						: "Unknown" }}
				</p>
			</v-card-text>

			<!-- Actions -->
			<v-card-actions>
				<v-button v-if="build" :href="site[config.keys.url]">
					<v-icon name="launch" /> View
				</v-button>
				<v-button v-if="build && site[config.keys.log]" @click="displayLog(site)">
					<v-icon name="text_snippet" /> Log
				</v-button>
				<v-button
					v-if="build"
					@click="startBuild(site)"
					:disabled="siteIsBuilding(site) || (!config.allow_concurrent_builds && anySiteIsBuilding)"
				>
					<v-icon name="build" /> Build
				</v-button>
				<v-button v-if="settings" class="danger" @click="promptDeleteSite(site)">
					<v-icon name="delete" /> Delete
				</v-button>
			</v-card-actions>
		</v-card>

		<!-- Confirmation / Error Dialog -->
		<Dialog
			:show="!!dialog"
			:title="dialog?.title"
			:message="dialog?.message"
			:close="dialog?.close"
			@close="dialog = undefined"
			:action="dialog?.action"
			@action="dialog?.onAction?.()"
		/>

		<!-- Log Drawer -->
		<LogDrawer v-if="log" :show="!!log" :site="log" @close="onLogClose" />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from "vue";
import config from "../../config";
import LogDrawer from "./logDrawer.vue";
import { removeSite, buildSite, getLastActivityId } from "../settings";
import Dialog from "./Dialog.vue";

interface Site {
	[key: string]: any;
}

const props = defineProps<{
	sites: Site[];
	page?: string;
}>();

const emit = defineEmits<{
	(e: "update"): void;
	(e: "loading"): void;
}>();

const api = inject("api") as any;

const lastActivityId = ref<number | undefined>();
const dialog = ref<any>();
const log = ref<Site | undefined>();
let updateInterval: ReturnType<typeof setInterval> | undefined;

// Computed
const build = computed(() => props.page === "build");
const settings = computed(() => props.page === "settings");

const anySiteIsBuilding = computed(() =>
	props.sites.some((site) => site[config.keys.status] === config.statuses.started)
);

// Methods
function siteUpdateAvailable(site: Site) {
	return lastActivityId.value && parseInt(String(lastActivityId.value)) > parseInt(site[config.keys.activity]);
}

function siteIsBuilding(site: Site) {
	return site[config.keys.status] === config.statuses.started;
}

function displayLog(site: Site) {
	log.value = site;
}

function onLogClose() {
	log.value = undefined;
	emit("update");
}

async function startBuild(site: Site) {
	site[config.keys.status] = config.statuses.started;
	const resp = await buildSite(api, site[config.keys.id]);
	if (resp?.error) {
		dialog.value = {
			title: "Build Error",
			message: `There was an error while running the build command for <strong>${site[config.keys.name]}</strong> (${resp.error}). View the log for more detailed information.`,
			action: "Close",
			onAction: () => {
				dialog.value = undefined;
				emit("update");
			},
		};
	} else {
		if (!log.value) emit("update");
	}
}

function promptDeleteSite(site: Site) {
	dialog.value = {
		title: "Delete Site?",
		message: `Are you sure you want to delete <strong>${site[config.keys.name]}</strong> from the Build Settings? The Site will not be removed from the server.`,
		close: "Cancel",
		action: "Delete",
		onAction: async () => {
			dialog.value = undefined;
			emit("loading");
			const success = await removeSite(api, site[config.keys.id]);
			if (!success) {
				alert("Error: Could not remove site!");
			}
			emit("update");
		},
	};
}

// Lifecycle
onMounted(async () => {
	lastActivityId.value = await getLastActivityId(api);
	if (!updateInterval) {
		updateInterval = setInterval(() => {
			if (anySiteIsBuilding.value) {
				emit("update");
			}
		}, 1000);
	}
});

onBeforeUnmount(() => {
	if (updateInterval) clearInterval(updateInterval);
});
</script>

<style scoped>
.site-card {
	margin: 25px auto;
	box-shadow: 0 2px 3px 2px rgba(0, 0, 0, 0.1);
	transition: 0.3s;
	max-width: 500px !important;
}
.site-card:hover {
	box-shadow: 0 3px 4px 3px rgba(0, 0, 0, 0.1);
}
.site-card-update {
	padding: 5px 10px;
}
.site-card-update-available {
	background-color: var(--warning);
	color: var(--warning-alt);
}
.site-card-update-none {
	background-color: var(--success);
	color: var(--success-alt);
}
.site-card-update-building {
	background-color: var(--blue);
	color: var(--blue-alt);
}
.v-progress-circular {
	float: right;
}
.site-card span.id-badge {
	background-color: var(--v-chip-background-color);
	color: var(--v-chip-color);
	border-radius: 5px;
	margin-left: 10px;
	width: 25px;
	height: 25px;
	text-align: center;
	font-size: 14px;
}
.site-card code {
	font-family: Monaco, monospace;
	line-height: 100%;
	padding: 0.2em;
}
.site-card .v-button.danger {
	--v-button-color: var(--danger-alt);
	--v-button-background-color: var(--danger);
	--v-button-color-hover: var(--danger-alt);
	--v-button-background-color-hover: var(--danger-125);
}
.site-card ul.envvar-list {
	list-style: none;
	padding-inline-start: 15px;
}
.site-card ul.envvar-list li {
	font-family: monospace;
}
</style>
